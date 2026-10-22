import type { Channel } from "@poc/greycollar";

const sms: Channel = {
  name: "sms",
  send: (to, text) => console.log(`[sms] → ${to}: ${text}`),
};

export default sms;
