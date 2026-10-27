class InAppNotification{constructor(data){this.data=data;}deliver(db){db.prepare('INSERT INTO notifications(user_id,type,message) VALUES(?,?,?)').run(this.data.userId,this.data.type,this.data.message);return {delivered:true,channel:'in_app'};}}
class EmailNotification{deliver(){return {delivered:false,channel:'email',reason:'No email provider configured'};}}
class SMSNotification{deliver(){return {delivered:false,channel:'sms',reason:'No SMS provider configured'};}}
class NotificationFactory{static create(channel,data){if(channel==='in_app')return new InAppNotification(data);if(channel==='email')return new EmailNotification(data);if(channel==='sms')return new SMSNotification(data);throw new Error('Unsupported notification channel');}}
module.exports={NotificationFactory,InAppNotification,EmailNotification,SMSNotification};
