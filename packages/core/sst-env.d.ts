/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
import "sst"
declare module "sst" {
  export interface Resource {
    "Auth": {
      "type": "sst.aws.Auth"
      "url": string
    }
    "AuthDynomoTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "DatabaseProvider": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "DatabaseUrl": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GoogleClientId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GoogleClientSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "HonoOpenApiAws": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "MainAWSStorage": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "RealtimeServer": {
      "authorizer": string
      "endpoint": string
      "type": "sst.aws.Realtime"
    }
    "SolidStartApp": {
      "type": "sst.aws.SolidStart"
      "url": string
    }
  }
}
// cloudflare 
import * as cloudflare from "@cloudflare/workers-types";
declare module "sst" {
  export interface Resource {
    "MainCloudflareStorage": cloudflare.R2Bucket
  }
}
