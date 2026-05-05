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

@description('Container image reference (e.g. myacr.azurecr.io/pizza-app:1.2.3). If empty, deploys a placeholder image and the CD workflow updates it.')
param containerImage string = ''

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
var placeholderImage = 'mcr.microsoft.com/k8se/quickstart:latest'
var imageToDeploy = empty(containerImage) ? placeholderImage : containerImage

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

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: empty(containerImage) ? [] : [
        {
          server: '${acrName}.azurecr.io'
          identity: 'system'
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

// Grant the Container App's managed identity AcrPull on the registry
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, containerApp.id, acrPullRoleId)
  scope: acr
  properties: {
    principalId: containerApp.identity.principalId
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
