const { notarize } = require('electron-notarize');

async function notarizing() {


    const appName = 'Piman Discuss';

    try {
        await notarize({
            appBundleId: 'com.piman-discuss.piman',
            appPath: '/Users/kawtar/apps/discuss-electron-new/release-builds/Piman Discuss-darwin-x64/Piman Discuss.app',
            appleId: "kawtar.nouara@gmail.com",
            appleIdPassword: ""
        });
    } catch(err){
        console.error('error ' , err)
    }

};
notarizing()
