const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendPushNotification = functions.firestore.document('clients/{clientId}')
    .onUpdate((change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (before.status !== after.status && after.status === 'expiring') {
            const payload = {
                notification: {
                    title: 'Subscription Expiring Soon',
                    body: `Your subscription for ${after.name} is expiring soon.`,
                },
            };
            return admin.messaging().sendToTopic(after.uid, payload);
        }
        return null;
    });

exports.archiveInactiveClients = functions.pubsub.schedule('0 0 1 * *')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();
        const threeMonthsAgo = new Date(now.toDate());
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const inactiveClients = await admin.firestore().collection('clients')
            .where('lastActive', '<=', threeMonthsAgo)
            .get();

        const batch = admin.firestore().batch();
        inactiveClients.forEach(doc => {
            batch.update(doc.ref, { status: 'archived' });
        });

        return batch.commit();
    });

exports.updateClientAges = functions.pubsub.schedule('0 0 1 1 *')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        const clients = await admin.firestore().collection('clients').get();
        const batch = admin.firestore().batch();

        clients.forEach(doc => {
            const data = doc.data();
            const newAge = data.age + 1;
            batch.update(doc.ref, { age: newAge });
        });

        return batch.commit();
    });