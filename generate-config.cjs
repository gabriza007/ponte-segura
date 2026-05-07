const fs = require('fs');
if (!fs.existsSync('firebase-applet-config.json')) {
  fs.writeFileSync('firebase-applet-config.json', JSON.stringify({
    apiKey: 'dummy-api-key',
    authDomain: 'dummy-auth-domain.firebaseapp.com',
    projectId: 'dummy-project-id',
    storageBucket: 'dummy-project-id.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456',
    firestoreDatabaseId: 'dummy-database-id'
  }, null, 2));
  console.log("Created dummy firebase-applet-config.json");
}
