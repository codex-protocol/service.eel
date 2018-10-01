#!/bin/sh

# this makes sure nvm (and thus global npm packages) are in the path
source /home/ec2-user/.bash_profile

# set the NODE_ENV environment variable based on the CodeDeploy deployment group
#  name
if [[ $DEPLOYMENT_GROUP_NAME == "mainnet" ]] || [[ $DEPLOYMENT_GROUP_NAME == "rinkeby" ]]
then
  NODE_ENV=production
elif [[ $DEPLOYMENT_GROUP_NAME == "ropsten" ]]
then
  NODE_ENV=staging
else
  NODE_ENV=development
fi

# copy secrets from aws secrets manager to the .env file
$(/opt/process/deployment/secrets-to-env.sh)

# tell pm2 to reload the application(s)
NODE_ENV=$NODE_ENV pm2 reload /opt/process/deployment/pm2/processes.yml
