// Pizza App - Azure Container Apps platform
// Deploys: Log Analytics, Application Insights, availability monitoring, Container Registry, Container Apps Environment, user-assigned identity, AcrPull.
// The container app itself is deployed separately by the app workflow via infra/app.bicep.
// Targets: resource group scope

targetScope = 'resourceGroup'

@description('Base name used for all resources. Keep short; ACR name will be derived and must be globally unique.')
@minLength(3)
@maxLength(20)
param appName string = 'pizzaapp'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Tags applied to all resources.')
param tags object = {
  app: 'pizza-app'
  managedBy: 'bicep'
}

// Derived names
var acrName = toLower('${appName}acr${uniqueString(resourceGroup().id)}')
var environmentName = '${appName}-env'
var logAnalyticsName = '${appName}-logs'
var applicationInsightsName = '${appName}-insights'
var availabilityTestName = '${appName}-availability'
var availabilityAlertName = '${appName}-availability-alert'

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
      RequestUrl: 'https://${appName}.${containerAppsEnv.properties.defaultDomain}/api/menu'
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

resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: availabilityAlertName
  location: 'global'
  tags: union(tags, {
    'hidden-link:${applicationInsights.id}': 'Resource'
    'hidden-link:${availabilityTest.id}': 'Resource'
  })
  properties: {
    description: 'Alerts when the Pizza App availability test fails.'
    severity: 2
    enabled: true
    scopes: [
      availabilityTest.id
      applicationInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    autoMitigate: true
    targetResourceType: 'Microsoft.Insights/webtests'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      componentId: applicationInsights.id
      webTestId: availabilityTest.id
      failedLocationCount: 1
    }
    actions: []
  }
}

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-identity'
  location: location
  tags: tags
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
output containerAppEnvName string = containerAppsEnv.name
output uamiName string = uami.name
output resourceGroupName string = resourceGroup().name
