import { fetch, toPassportConfig } from "passport-saml-metadata";
import * as fs from "fs";
import * as path from "path";
import * as retry from "async-retry";
import { DatabaseConnection } from "./DatabaseConnection";
import { Logger } from "./Logger";
import { NoderedUtil } from "openflow-api";

export class Config {
    public static getversion(): string {
        var versionfile: string = path.join(__dirname, "VERSION");
        if (!fs.existsSync(versionfile)) versionfile = path.join(__dirname, "..", "VERSION")
        if (!fs.existsSync(versionfile)) versionfile = path.join(__dirname, "..", "..", "VERSION")
        if (!fs.existsSync(versionfile)) versionfile = path.join(__dirname, "..", "..", "..", "VERSION")
        Config.version = (fs.existsSync(versionfile) ? fs.readFileSync(versionfile, "utf8") : "0.0.1");
        return Config.version;
    }
    public static reload(): void {
        Config.getversion();
        Config.logpath = Config.getEnv("logpath", __dirname);
        Config.log_queries = Config.parseBoolean(Config.getEnv("log_queries", "false"));
        Config.getting_started_url = Config.getEnv("getting_started_url", "");

        Config.NODE_ENV = Config.getEnv("NODE_ENV", "development");

        Config.stripe_api_key = Config.getEnv("stripe_api_key", "");
        Config.stripe_api_secret = Config.getEnv("stripe_api_secret", "");

        Config.supports_watch = Config.parseBoolean(Config.getEnv("supports_watch", "false"));

        Config.auto_create_users = Config.parseBoolean(Config.getEnv("auto_create_users", "false"));
        Config.auto_create_domains = Config.parseArray(Config.getEnv("auto_create_domains", ""));
        Config.allow_user_registration = Config.parseBoolean(Config.getEnv("allow_user_registration", "false"));
        Config.allow_personal_nodered = Config.parseBoolean(Config.getEnv("allow_personal_nodered", "false"));
        Config.auto_create_personal_nodered_group = Config.parseBoolean(Config.getEnv("auto_create_personal_nodered_group", "false"));

        Config.tls_crt = Config.getEnv("tls_crt", "");
        Config.tls_key = Config.getEnv("tls_key", "");
        Config.tls_ca = Config.getEnv("tls_ca", "");
        Config.tls_passphrase = Config.getEnv("tls_passphrase", "");

        Config.api_credential_cache_seconds = parseInt(Config.getEnv("api_credential_cache_seconds", "60000"));

        Config.client_heartbeat_timeout = parseInt(Config.getEnv("client_heartbeat_timeout", "60"));

        Config.expected_max_roles = parseInt(Config.getEnv("expected_max_roles", "4000"));
        Config.update_acl_based_on_groups = Config.parseBoolean(Config.getEnv("update_acl_based_on_groups", "false"));
        Config.multi_tenant = Config.parseBoolean(Config.getEnv("multi_tenant", "false"));
        Config.api_bypass_perm_check = Config.parseBoolean(Config.getEnv("api_bypass_perm_check", "false"));
        Config.websocket_package_size = parseInt(Config.getEnv("websocket_package_size", "4096"), 10);
        Config.websocket_max_package_count = parseInt(Config.getEnv("websocket_max_package_count", "1024"), 10);
        Config.protocol = Config.getEnv("protocol", "http"); // used by personal nodered and baseurl()
        Config.port = parseInt(Config.getEnv("port", "3000"));
        Config.domain = Config.getEnv("domain", "localhost"); // sent to website and used in baseurl()


        Config.amqp_reply_expiration = parseInt(Config.getEnv("amqp_reply_expiration", "10000")); // 10 seconds
        Config.amqp_force_queue_prefix = Config.parseBoolean(Config.getEnv("amqp_force_queue_prefix", "true"));
        Config.amqp_force_exchange_prefix = Config.parseBoolean(Config.getEnv("amqp_force_exchange_prefix", "true"));
        Config.amqp_url = Config.getEnv("amqp_url", "amqp://localhost"); // used to register queues and by personal nodered
        Config.amqp_check_for_consumer = Config.parseBoolean(Config.getEnv("amqp_check_for_consumer", "true"));
        Config.amqp_default_expiration = parseInt(Config.getEnv("amqp_default_expiration", "10000")); // 10 seconds
        Config.amqp_requeue_time = parseInt(Config.getEnv("amqp_requeue_time", "1000")); // 1 seconds    
        Config.amqp_dlx = Config.getEnv("amqp_dlx", "openflow-dlx");  // Dead letter exchange, used to pickup dead or timeout messages

        Config.mongodb_url = Config.getEnv("mongodb_url", "mongodb://localhost:27017");
        Config.mongodb_db = Config.getEnv("mongodb_db", "openflow");

        Config.skip_history_collections = Config.getEnv("skip_history_collections", "");
        Config.allow_skiphistory = Config.parseBoolean(Config.getEnv("allow_skiphistory", "true"));

        Config.saml_issuer = Config.getEnv("saml_issuer", "the-issuer"); // define uri of STS, also sent to personal nodereds
        Config.aes_secret = Config.getEnv("aes_secret", "");
        Config.signing_crt = Config.getEnv("signing_crt", "");
        Config.singing_key = Config.getEnv("singing_key", "");
        Config.shorttoken_expires_in = Config.getEnv("shorttoken_expires_in", "5m");
        Config.longtoken_expires_in = Config.getEnv("longtoken_expires_in", "365d");
        Config.downloadtoken_expires_in = Config.getEnv("downloadtoken_expires_in", "15m");
        Config.personalnoderedtoken_expires_in = Config.getEnv("personalnoderedtoken_expires_in", "365d");

        Config.nodered_image = Config.getEnv("nodered_image", "cloudhack/openflownodered:edge");
        Config.saml_federation_metadata = Config.getEnv("saml_federation_metadata", "");
        Config.api_ws_url = Config.getEnv("api_ws_url", "ws://localhost:3000");
        Config.namespace = Config.getEnv("namespace", ""); // also sent to website 
        Config.nodered_domain_schema = Config.getEnv("nodered_domain_schema", ""); // also sent to website
        Config.nodered_initial_liveness_delay = parseInt(Config.getEnv("nodered_initial_liveness_delay", "60"));
    }
    public static db: DatabaseConnection = null;
    public static license_key: string = Config.getEnv("license_key", "");
    public static version: string = Config.getversion();
    public static logpath: string = Config.getEnv("logpath", __dirname);
    public static log_queries: boolean = Config.parseBoolean(Config.getEnv("log_queries", "false"));
    public static getting_started_url: string = Config.getEnv("getting_started_url", "");

    public static NODE_ENV: string = Config.getEnv("NODE_ENV", "development");

    public static stripe_api_key: string = Config.getEnv("stripe_api_key", "");
    public static stripe_api_secret: string = Config.getEnv("stripe_api_secret", "");

    public static supports_watch: boolean = Config.parseBoolean(Config.getEnv("supports_watch", "false"));

    public static auto_create_users: boolean = Config.parseBoolean(Config.getEnv("auto_create_users", "false"));
    public static auto_create_domains: string[] = Config.parseArray(Config.getEnv("auto_create_domains", ""));
    public static allow_user_registration: boolean = Config.parseBoolean(Config.getEnv("allow_user_registration", "false"));
    public static allow_personal_nodered: boolean = Config.parseBoolean(Config.getEnv("allow_personal_nodered", "false"));
    public static auto_create_personal_nodered_group: boolean = Config.parseBoolean(Config.getEnv("auto_create_personal_nodered_group", "false"));

    public static tls_crt: string = Config.getEnv("tls_crt", "");
    public static tls_key: string = Config.getEnv("tls_key", "");
    public static tls_ca: string = Config.getEnv("tls_ca", "");
    public static tls_passphrase: string = Config.getEnv("tls_passphrase", "");

    public static api_credential_cache_seconds: number = parseInt(Config.getEnv("api_credential_cache_seconds", "60000"));

    public static client_heartbeat_timeout: number = parseInt(Config.getEnv("client_heartbeat_timeout", "60"));

    public static expected_max_roles: number = parseInt(Config.getEnv("expected_max_roles", "4000"));
    public static update_acl_based_on_groups: boolean = Config.parseBoolean(Config.getEnv("update_acl_based_on_groups", "false"));
    public static multi_tenant: boolean = Config.parseBoolean(Config.getEnv("multi_tenant", "false"));
    public static api_bypass_perm_check: boolean = Config.parseBoolean(Config.getEnv("api_bypass_perm_check", "false"));
    public static websocket_package_size: number = parseInt(Config.getEnv("websocket_package_size", "4096"), 10);
    public static websocket_max_package_count: number = parseInt(Config.getEnv("websocket_max_package_count", "1024"), 10);
    public static protocol: string = Config.getEnv("protocol", "http"); // used by personal nodered and baseurl()
    public static port: number = parseInt(Config.getEnv("port", "3000"));
    public static domain: string = Config.getEnv("domain", "localhost"); // sent to website and used in baseurl()


    public static amqp_reply_expiration: number = parseInt(Config.getEnv("amqp_reply_expiration", (60 * 1000).toString())); // 1 min
    public static amqp_force_queue_prefix: boolean = Config.parseBoolean(Config.getEnv("amqp_force_queue_prefix", "true"));
    public static amqp_force_exchange_prefix: boolean = Config.parseBoolean(Config.getEnv("amqp_force_exchange_prefix", "true"));
    public static amqp_url: string = Config.getEnv("amqp_url", "amqp://localhost"); // used to register queues and by personal nodered
    public static amqp_check_for_consumer: boolean = Config.parseBoolean(Config.getEnv("amqp_check_for_consumer", "true"));
    public static amqp_default_expiration: number = parseInt(Config.getEnv("amqp_default_expiration", (60 * 1000).toString())); // 1 min
    public static amqp_requeue_time: number = parseInt(Config.getEnv("amqp_requeue_time", "1000")); // 1 seconds    
    public static amqp_dlx: string = Config.getEnv("amqp_dlx", "openflow-dlx");  // Dead letter exchange, used to pickup dead or timeout messages

    public static mongodb_url: string = Config.getEnv("mongodb_url", "mongodb://localhost:27017");
    public static mongodb_db: string = Config.getEnv("mongodb_db", "openflow");

    public static skip_history_collections: string = Config.getEnv("skip_history_collections", "");
    public static allow_skiphistory: boolean = Config.parseBoolean(Config.getEnv("allow_skiphistory", "true"));

    public static saml_issuer: string = Config.getEnv("saml_issuer", "the-issuer"); // define uri of STS, also sent to personal nodereds
    public static aes_secret: string = Config.getEnv("aes_secret", "");
    public static signing_crt: string = Config.getEnv("signing_crt", "");
    public static singing_key: string = Config.getEnv("singing_key", "");
    public static shorttoken_expires_in: string = Config.getEnv("shorttoken_expires_in", "5m");
    public static longtoken_expires_in: string = Config.getEnv("longtoken_expires_in", "365d");
    public static downloadtoken_expires_in: string = Config.getEnv("downloadtoken_expires_in", "15m");
    public static personalnoderedtoken_expires_in: string = Config.getEnv("personalnoderedtoken_expires_in", "365d");

    public static nodered_image: string = Config.getEnv("nodered_image", "cloudhack/openflownodered:edge");
    public static saml_federation_metadata: string = Config.getEnv("saml_federation_metadata", "");
    public static api_ws_url: string = Config.getEnv("api_ws_url", "ws://localhost:3000");
    public static namespace: string = Config.getEnv("namespace", ""); // also sent to website 
    public static nodered_domain_schema: string = Config.getEnv("nodered_domain_schema", ""); // also sent to website
    public static nodered_initial_liveness_delay: number = parseInt(Config.getEnv("nodered_initial_liveness_delay", "60"));

    public static baseurl(): string {
        var result: string = "";
        if (Config.tls_crt != '' && Config.tls_key != '') {
            result = "https://" + Config.domain;
        } else {
            result = Config.protocol + "://" + Config.domain;
        }
        if (Config.port != 80 && Config.port != 443) {
            result = result + ":" + Config.port + "/";
        } else { result = result + "/"; }
        return result;
    }
    public static getEnv(name: string, defaultvalue: string): string {
        var value: any = process.env[name];
        if (!value || value === "") { value = defaultvalue; }
        return value;
    }
    public static async parse_federation_metadata(url: string): Promise<any> {
        // if anything throws, we retry
        var metadata: any = await retry(async bail => {
            var reader: any = await fetch({ url });
            if (NoderedUtil.IsNullUndefinded(reader)) { bail(new Error("Failed getting result")); return; }
            var config: any = toPassportConfig(reader);
            // we need this, for Office 365 :-/
            if (reader.signingCerts && reader.signingCerts.length > 1) {
                config.cert = reader.signingCerts;
            }
            return config;
        }, {
            retries: 50,
            onRetry: function (error: Error, count: number): void {
                Logger.instanse.warn("retry " + count + " error " + error.message + " getting " + url);
            }
        });
        return metadata;
    }
    public static parseArray(s: string): string[] {
        var arr = s.split(",");
        arr = arr.map(p => p.trim());
        arr = arr.filter(result => (result.trim() !== ""));
        return arr;
    }
    public static parseBoolean(s: any): boolean {
        var val: string = "false";
        if (typeof s === "number") {
            val = s.toString();
        } else if (typeof s === "string") {
            val = s.toLowerCase().trim();
        } else if (typeof s === "boolean") {
            val = s.toString();
        } else {
            throw new Error("Unknown type!");
        }
        switch (val) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(s);
        }
    }

}
