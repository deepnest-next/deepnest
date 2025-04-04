/**
 * Graham's Scan Convex Hull Algorithm
 * @desc An implementation of the Graham's Scan Convex Hull algorithm in JavaScript.
 * @author Brian Barnett, brian@3kb.co.uk, http://brianbar.net/ || http://3kb.co.uk/
 * @version 1.0.4
 */
function ConvexHullGrahamScan() {
  (this.anchorPoint = void 0), (this.reverse = !1), (this.points = []);
}
(ConvexHullGrahamScan.prototype = {
  constructor: ConvexHullGrahamScan,
  Point: function (n, t) {
    (this.x = n), (this.y = t);
  },
  _findPolarAngle: function (n, t) {
    var i,
      o,
      h = 57.295779513082;
    if (!n || !t) return 0;
    if (((i = t.x - n.x), (o = t.y - n.y), 0 == i && 0 == o)) return 0;
    var r = Math.atan2(o, i) * h;
    return this.reverse ? 0 >= r && (r += 360) : r >= 0 && (r += 360), r;
  },
  addPoint: function (n, t) {
    return void 0 === this.anchorPoint
      ? void (this.anchorPoint = new this.Point(n, t))
      : (this.anchorPoint.y > t && this.anchorPoint.x > n) ||
        (this.anchorPoint.y === t && this.anchorPoint.x > n) ||
        (this.anchorPoint.y > t && this.anchorPoint.x === n)
      ? (this.points.push(
          new this.Point(this.anchorPoint.x, this.anchorPoint.y)
        ),
        void (this.anchorPoint = new this.Point(n, t)))
      : void this.points.push(new this.Point(n, t));
  },
  _sortPoints: function () {
    var n = this;
    return this.points.sort(function (t, i) {
      var o = n._findPolarAngle(n.anchorPoint, t),
        h = n._findPolarAngle(n.anchorPoint, i);
      return h > o ? -1 : o > h ? 1 : 0;
    });
  },
  _checkPoints: function (n, t, i) {
    var o,
      h = this._findPolarAngle(n, t),
      r = this._findPolarAngle(n, i);
    return h > r
      ? ((o = h - r), !(o > 180))
      : r > h
      ? ((o = r - h), o > 180)
      : !0;
  },
  getHull: function () {
    var n,
      t,
      i = [];
    if (
      ((this.reverse = this.points.every(function (n) {
        return n.x < 0 && n.y < 0;
      })),
      (n = this._sortPoints()),
      (t = n.length),
      3 > t)
    )
      return n.unshift(this.anchorPoint), n;
    for (i.push(n.shift(), n.shift()); ; ) {
      var o, h, r;
      if (
        (i.push(n.shift()),
        (o = i[i.length - 3]),
        (h = i[i.length - 2]),
        (r = i[i.length - 1]),
        this._checkPoints(o, h, r) && i.splice(i.length - 2, 1),
        0 == n.length)
      ) {
        if (t == i.length) {
          var e = this.anchorPoint;
          return (
            (i = i.filter(function (n) {
              return !!n;
            })),
            i.some(function (n) {
              return n.x == e.x && n.y == e.y;
            }) || i.unshift(this.anchorPoint),
            i
          );
        }
        (n = i), (t = n.length), (i = []), i.push(n.shift(), n.shift());
      }
    }
  },
}),
  "function" == typeof define &&
    define.amd &&
    define(function () {
      return ConvexHullGrahamScan;
    }),
  "undefined" != typeof module && (module.exports = ConvexHullGrahamScan);
