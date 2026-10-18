// Sample photos of rooms and homes from Unsplash (free to use under the Unsplash License).
// They are illustrative only, not photos of the actual listings. If one fails to load, the
// app falls back to the drawn room picture.
const IDS = [
  "1505693416388-ac5ce068fe85", "1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688",
  "1560448204-e02f11c3d0e2", "1493809842364-78817add7ffb", "1484154218962-a197022b5858",
  "1586023492125-27b2c045efd7", "1512917774080-9991f1c4c750", "1564013799919-ab600027ffc6",
  "1568605114967-8130f3a36994", "1570129477492-45c003edd2be", "1600585154340-be6161a56a0c",
  "1600596542815-ffad4c1539a9", "1600607687939-ce8a6c25118c", "1600566753190-17f0baa2a6c3",
  "1554995207-c18c203602cb", "1540518614846-7eded433c457", "1513694203232-719a280e022f",
];

export const photoFor = (l, w = 900) =>
  `https://images.unsplash.com/photo-${IDS[l.id % IDS.length]}?auto=format&fit=crop&w=${w}&q=70`;
