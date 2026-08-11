using './app.bicep'

param appName = 'pizzaapp'
param appVersion = '0.0.0'
param minReplicas = 1
param maxReplicas = 3
param cpu = '0.5'
param memory = '1.0Gi'
// containerImage is required and supplied by the app CD workflow.
param containerImage = ''
