export const domain =
  {
    production: "wfa.oetzi.dev",
    dev: "dev.wfa.oetzi.dev",
  }[$app.stage] || $app.stage + ".dev.wfa.oetzi.dev";

export const zone = cloudflare.getZoneOutput({
  name: "wfa.oetzi.dev",
});

export const cf = sst.cloudflare.dns({
  zone: zone.zoneId,
});
