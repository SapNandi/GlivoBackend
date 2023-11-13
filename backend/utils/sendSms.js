const sendSms = async (options) => {
  const accountSid = process.env.TWILLO_ACCOUNT_SID;
  const authToken = process.env.TWILLO_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  let msgOptions = {
    from: process.env.TWILLO_PHONE_NUMBER,
    to: options.number,
    body: options.note,
  };

  await client.messages.create(msgOptions);
};

module.exports = sendSms;
