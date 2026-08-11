// Pizza App - Azure Container Apps infrastructure
// Deploys: Log Analytics, Container Apps Environment, Azure Container Registry, Container App
// Targets: resource group scope

targetScope = 'resourceGroup'

@description('Base name used for all resources. Keep short; ACR name will be derived and must be globally unique.')
@minLength(3)
@maxLength(20)
param appName string = 'pizzaapp'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Container image reference (e.g. myacr.azurecr.io/pizza-app:1.2.3). If empty, the currently deployed image is preserved (or a placeholder on first deploy).')
param containerImage string = ''

@description('Set true when the container app already exists so its deployed image is preserved across infrastructure deployments.')
param appExists bool = false

@description('Application version (from VERSION file).')
param appVersion string = '0.0.0'

@description('Min replicas for the Container App.')
@minValue(0)
@maxValue(25)
param minReplicas int = 1

@description('Max replicas for the Container App.')
@minValue(1)
@maxValue(25)
param maxReplicas int = 3

@description('CPU cores per replica.')
param cpu string = '0.5'

@description('Memory per replica.')
param memory string = '1.0Gi'

@description('Tags applied to all resources.')
param tags object = {
  app: 'pizza-app'
  managedBy: 'bicep'
}

// Derived names
var acrName = toLower('${appName}acr${uniqueString(resourceGroup().id)}')
var environmentName = '${appName}-env'
var containerAppName = appName
var logAnalyticsName = '${appName}-logs'
var applicationInsightsName = '${appName}-insights'
var availabilityTestName = '${appName}-availability'
var placeholderImage = 'mcr.microsoft.com/k8se/quickstart:latest'

// Upsert: preserve the currently deployed image so infrastructure deployments never revert to the placeholder.
resource existingContainerApp 'Microsoft.App/containerApps@2024-03-01' existing = if (appExists) {
  name: containerAppName
}

var imageToDeploy = !empty(containerImage)
  ? containerImage
  : (existingContainerApp.?properties.template.containers[0].image ?? placeholderImage)

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-identity'
  location: location
  tags: tags
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uami.id}': {}
    }
  }
  dependsOn: [
    acrPullAssignment
  ]
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'appinsights-connection-string'
          value: applicationInsights.properties.ConnectionString
        }
      ]
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: uami.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: imageToDeploy
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'APP_VERSION'
              value: appVersion
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
            {
              name: 'OTEL_SERVICE_NAME'
              value: appName
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/menu'
                port: 3000
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/menu'
                port: 3000
              }
              initialDelaySeconds: 5
              periodSeconds: 10
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: availabilityTestName
  location: location
  tags: union(tags, {
    'hidden-link:${applicationInsights.id}': 'Resource'
  })
  kind: 'standard'
  properties: {
    Name: availabilityTestName
    SyntheticMonitorId: availabilityTestName
    Kind: 'standard'
    Enabled: true
    Frequency: 300
    Timeout: 30
    RetryEnabled: true
    Locations: [
      {
        Id: 'us-va-ash-azr'
      }
    ]
    Request: {
      RequestUrl: 'https://${containerApp.properties.configuration.ingress.fqdn}/api/menu'
      HttpVerb: 'GET'
      FollowRedirects: true
      ParseDependentRequests: false
    }
    ValidationRules: {
      ExpectedHttpStatusCode: 200
      IgnoreHttpStatusCode: false
      SSLCheck: true
      SSLCertRemainingLifetimeCheck: 7
    }
  }
}

// Grant the Container App's user-assigned identity AcrPull on the registry
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, uami.id, acrPullRoleId)
  scope: acr
  properties: {
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output containerAppName string = containerApp.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppEnvName string = containerAppsEnv.name
output resourceGroupName string = resourceGroup().name
