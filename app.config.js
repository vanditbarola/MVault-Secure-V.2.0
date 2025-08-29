// app.config.js - Extends app.json with dynamic configuration
const config = require('./app.json');

module.exports = {
  ...config,
  expo: {
    ...config.expo,
    // Use updated slug for new project
    slug: 'mvault-secure-app',
    extra: {
      ...config.expo.extra,
      eas: {
        projectId: '0dc4be0b-e237-49d0-8eab-e93e815d072d'
      }
    },
    web: {
      ...config.expo.web,
      name: 'MVault',
      shortName: 'MVault',
      // Set the web title to MVault
      config: {
        ...config.expo.web?.config,
        WEB_TITLE: 'MVault - Secure Money Management'
      }
    }
  }
};