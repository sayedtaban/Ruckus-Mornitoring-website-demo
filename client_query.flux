from(bucket: "demo")
  |> range(start: -15m)
  |> filter(fn: (r) => r["_measurement"] == "client")
  |> limit(n: 10)
