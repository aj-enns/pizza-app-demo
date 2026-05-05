using './main.bicep'

param appName = 'pizzaapp'
param appVersion = '0.0.0'
param minReplicas = 1
param maxReplicas = 3
param cpu = '0.5'
param memory = '1.0Gi'
// containerImage is set by the CI/CD workflow (left empty here so first
// deployment uses the placeholder image; the app workflow updates it).
param containerImage = ''
