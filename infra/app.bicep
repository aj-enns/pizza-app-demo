// Pizza App - Container App
// Owned and deployed by the application CD workflow with the freshly built image.
// References platform resources (environment, registry, identity, App Insights) from main.bicep.

targetScope = 'resourceGroup'

@description('Base name used to locate platform resources and name the container app.')
@minLength(3)
@maxLength(20)
param appName string = 'pizzaapp'

@description('Azure region for the container app.')
param location string = resourceGroup().location

@description('Container image reference to deploy (e.g. myacr.azurecr.io/pizza-app:1.2.3).')
param containerImage string

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

var acrName = toLower('${appName}acr${uniqueString(resourceGroup().id)}')

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: acrName
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: '${appName}-env'
}

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: '${appName}-identity'
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: '${appName}-insights'
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uami.id}': {}
    }
  }
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
          name: appName
          image: containerImage
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

output containerAppName string = containerApp.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
