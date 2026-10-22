import type { LinkConfig } from "@canmingir/link-express/link";

const config: LinkConfig = {
  project: {
    name: "architecture-poc",
    version: "0.0.1",
    oauth: {
      jwt: { identifier: "id" },
      providers: {},
    },
  },
  postgres: {
    uri: "sqlite:///:memory:",
    debug: false,
    sync: true,
  },
  event: {
    type: "inMemory",
    host: "localhost",
    protocol: "http",
    port: 8080,
  },
};

export default config;
