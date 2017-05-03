var GeoPoint = function(rng, lat, lng) {
  this.rng = rng;
  if (lat === undefined && lng === undefined) {
    this.lat = rng.floatBetween(0, Math.PI); // colatitude, actually
    this.lng = rng.floatBetween(0, 2 * Math.PI);
  } else {
    this.lat = lat;
    this.lng = lng;
  }
}
GeoPoint.interpolate = function(p0, p1, step) {
  var lat0 = Math.PI * 0.5 - p0.lat;
  var lat1 = Math.PI * 0.5 - p1.lat;
  var lat = (lat1 - lat0) * 0.5;
  var lng = (p1.lng - p0.lng) * 0.5;

  var a = Math.sin(lat) * Math.sin(lat) +
          Math.cos(lat0) * Math.cos(lat1) * Math.sin(lng) * Math.sin(lng);
  var d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  var u = Math.sin((1 - step) * d) / Math.sin(d);
  var v = Math.sin(step * d) / Math.sin(d);

  var x = u * Math.cos(lat0) * Math.cos(p0.lng) + v * Math.cos(lat1) * Math.cos(p1.lng);
  var y = u * Math.cos(lat0) * Math.sin(p0.lng) + v * Math.cos(lat1) * Math.sin(p1.lng);
  var z = u * Math.sin(lat0) + v * Math.sin(lat1);

  return new GeoPoint(null, Math.PI * 0.5 - Math.atan2(z, Math.sqrt(x * x + y * y)), Math.atan2(y, x));
}
GeoPoint.prototype.distTo = function(point) {
  var lat0 = Math.PI * 0.5 - this.lat;
  var lat1 = Math.PI * 0.5 - point.lat;
  var lat = (lat1 - lat0) * 0.5;
  var lng = (point.lng - this.lng) * 0.5;

  var a = Math.sin(lat) * Math.sin(lat) +
          Math.cos(lat0) * Math.cos(lat1) * Math.sin(lng) * Math.sin(lng);
  var d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d;
}
GeoPoint.prototype.toCoords = function(radius) {
  return [
    radius * Math.sin(this.lat) * Math.cos(this.lng),
    radius * Math.sin(this.lat) * Math.sin(this.lng),
    radius * Math.cos(this.lat)
  ];
}
var GeoVertex = function(rng, lat, lng) {
  GeoPoint.call(this, rng, lat, lng);
  this.touches = []; // GeoTile[]
  this.protrudes = []; // GeoEdge[]
  this.adjacent = []; // GeoVertex[]
  this.id = 'v' + (GeoVertex._next++);
}
GeoVertex._next = 0;
GeoVertex.prototype = Object.create(GeoPoint.prototype);
GeoVertex.interpolate = function(v0, v1, step) {
  var pt = GeoPoint.interpolate(v0, v1, step);
  return new GeoVertex(null, pt.lat, pt.lng);
}
var GeoEdge = function(v0, v1, d0, d1, noupdate) {
  this.v0 = v0;// GeoVertex
  this.v1 = v1;// GeoVertex
  this.d0 = d0;// GeoTile
  this.d1 = d1;// GeoTile

  if (!noupdate) {
    if (v0.touches.indexOf(d0) == -1) {
      v0.touches.push(d0);
    }
    if (v0.touches.indexOf(d1) == -1) {
      v0.touches.push(d1);
    }
    v0.protrudes.push(this);
    v0.adjacent.push(v1);

    if (v1.touches.indexOf(d0) == -1) {
      v1.touches.push(d0);
    }
    if (v1.touches.indexOf(d1) == -1) {
      v1.touches.push(d1);
    }
    v1.protrudes.push(this);
    v1.adjacent.push(v0);

    d0.neighbors.push(d1);
    d0.borders.push(this);
    if (d0.corners.indexOf(v0) == -1) {
      d0.corners.push(v0);
    }
    if (d0.corners.indexOf(v1) == -1) {
      d0.corners.push(v1);
    }

    d1.neighbors.push(d0);
    d1.borders.push(this);
    if (d1.corners.indexOf(v0) == -1) {
      d1.corners.push(v0);
    }
    if (d1.corners.indexOf(v1) == -1) {
      d1.corners.push(v1);
    }
  }
  this.id = 'e' + (GeoEdge._next++);
}
GeoEdge._next = 0;
GeoEdge.prototype.remove = function() {
  var v0 = this.v0;
  var v1 = this.v1;
  var d0 = this.d0;
  var d1 = this.d1;

  v0.touches.splice(v0.touches.indexOf(d0), 1);
  v0.touches.splice(v0.touches.indexOf(d1), 1);
  v0.protrudes.splice(v0.protrudes.indexOf(this), 1);
  v0.adjacent.splice(v0.adjacent.indexOf(v1), 1);

  v1.touches.splice(v1.touches.indexOf(d0), 1);
  v1.touches.splice(v1.touches.indexOf(d1), 1);
  v1.protrudes.splice(v1.protrudes.indexOf(this), 1);
  v1.adjacent.splice(v1.adjacent.indexOf(v0), 1);

  d0.neighbors.splice(d0.neighbors.indexOf(d1), 1);
  d0.borders.splice(d0.borders.indexOf(this), 1);
  d0.corners.splice(d0.corners.indexOf(v0), 1);
  d0.corners.splice(d0.corners.indexOf(v1), 1);

  d1.neighbors.splice(d1.neighbors.indexOf(d0), 1);
  d1.borders.splice(d1.borders.indexOf(this), 1);
  d1.corners.splice(d1.corners.indexOf(v0), 1);
  d1.corners.splice(d1.corners.indexOf(v1), 1);
}
GeoEdge.prototype.len = function() {
  return this.v0.distTo(this.v1);
}
var GeoTile = function(rng, center) {
  this.center = center === undefined ? new GeoPoint(rng) : center;
  this.neighbors = []; // GeoTile[]
  this.borders = []; // GeoEdge[]
  this.corners = []; // GeoVertex[]
  this.id = 't' + (GeoTile._next++);
}
GeoTile._next = 0;

var Globe = function(rng, radius, num_tiles) {
  this.rng = rng;
  this.verts = [];
  this.edges = [];
  this.tiles = [];
  for (var i = 0; i < num_tiles; i++) {
    this.tiles.push(new GeoTile(rng));
  }
}
Globe.prototype.validate = function() {
  return;
  // Checks graph for validity
  var used = {};
  this.verts.forEach(function(vert, i) {
    var used = {};
    console.assert(vert.touches.length >= 2, 'Vertex ', vert, ' touches less than 2 tiles');
    console.assert(vert.touches.length == vert.protrudes.length, 'Vertex ', vert, ' touches len != protrudes len');
    vert.touches.forEach(function(tile, j) {
      console.assert(tile.corners.indexOf(vert) > -1, 'Vertex ', vert, ' touches ', tile, ', but it does not contain it as corner');
      console.assert(!used[tile.id], 'Vertex ', vert, ' touches ', tile, ' twice');
      used[tile.id] = true;
    });

    used = {};
    console.assert(vert.protrudes.length >= 2, 'Vertex ', vert, ' has less than 2 protruding edges');
    vert.protrudes.forEach(function(edge, j) {
      console.assert((edge.v0 == vert) || (edge.v1 == vert), 'Vertex ', vert, ' has protruding edge ', edge, ', but edge is not connected to that vertex');
      console.assert(!used[edge.id], 'Vertex ', vert, ' protrudes ', edge, ' twice');
      console.assert(
        (edge.v0 == vert && vert.adjacent.indexOf(edge.v1) > -1) ||
        (edge.v1 == vert && vert.adjacent.indexOf(edge.v0) > -1),
        'Vertex ', vert, ' has protruding edge ', edge, ', but its other end is not adjacent to that vertex'
      )
      used[edge.id] = true;
    });

    used = {};
    console.assert(vert.adjacent.length >= 2, 'Vertex ', vert, ' has less than 2 adjacent vertices');
    console.assert(vert.adjacent.length == vert.protrudes.length, 'Vertex ', vert, ' adjacent len != protrudes len');
    vert.adjacent.forEach(function(adj, j) {
      console.assert(!used[adj.id], 'Vertex ', vert, ' is adjacent to ', adj, ' twice');
      used[adj.id] = true;
    });
  });
  this.edges.forEach(function(edge, i) {
    console.assert(edge.v0 != edge.v1, 'Edge ', edge, ' is connecting vertex ', edge.v0, ' to itself');
    console.assert(edge.d0 != edge.d1, 'Edge ', edge, ' is separating tile ', edge.d0, ' from itself');

    console.assert(edge.v0.adjacent.indexOf(edge.v1) > -1, 'Edge ', edge, ' is connecting ', edge.v0, ' to ', edge.v1, ', but it\'s not adjacent to it');
    console.assert(edge.v1.adjacent.indexOf(edge.v0) > -1, 'Edge ', edge, ' is connecting ', edge.v1, ' to ', edge.v0, ', but it\'s not adjacent to it');
    console.assert(edge.d0.neighbors.indexOf(edge.d1) > -1, 'Edge ', edge, ' is separating ', edge.d0, ' from ', edge.d1, ', but it\'s not a neighbor of it');
    console.assert(edge.d1.neighbors.indexOf(edge.d0) > -1, 'Edge ', edge, ' is separating ', edge.d1, ' from ', edge.d0, ', but it\'s not a neighbor of it');

    console.assert(edge.v0.protrudes.indexOf(edge) > -1, 'Edge ', edge, ' is connected to ', edge.v0, ', but it doesn\'t protrude from it');
    console.assert(edge.v1.protrudes.indexOf(edge) > -1, 'Edge ', edge, ' is connected to ', edge.v0, ', but it doesn\'t protrude from it');
    console.assert(edge.d0.borders.indexOf(edge) > -1, 'Edge ', edge, ' is separating ', edge.d0, ', but it is not a border of it');
    console.assert(edge.d1.borders.indexOf(edge) > -1, 'Edge ', edge, ' is separating ', edge.d1, ', but it is not a border of it');
  });
  this.tiles.forEach(function(tile, i) {

  });
}


// Utility
Globe.prototype.render = function(ctx, x, y, radius, angle) {
  function getCoords(vert) {
    var lng = vert.lng;
    vert.lng += angle;
    var coords = vert.toCoords(radius);
    vert.lng = lng;
    return coords;
  }


  ctx.fillStyle = '#c00';
  ctx.font = '9px sans-serif';
  /*
  this.tiles.forEach(function(tile, i) {
    var coords = getCoords(tile.center);

    ctx.globalAlpha = (coords[1] > 0.0) ? 1 : 0.1;

    ctx.beginPath();
    ctx.arc(x + coords[0], y - coords[2], 2, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.fillText(i, x + coords[0] + 2, y - coords[2] - 2);
  });
  */


  /*this.verts.forEach(function(vert, i) {
    var coords = getCoords(vert);

    ctx.globalAlpha = (coords[1] > 0.0) ? 1 : 0.1;

    ctx.beginPath();
    ctx.arc(x + coords[0], y - coords[2], 2, 0, 2 * Math.PI, false);
    ctx.fill();
    //ctx.fillText(i, x + coords[0] + 2, y - coords[2] - 2);
  });*/

  ctx.globalAlpha = 1;
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'black';
  var subdivisions = 30;
  /*this.edges.forEach(function(edge) {
    ctx.beginPath();

    var coords0 = getCoords(edge.v0);
    var moved;
    if (coords0[1] > 0.0) {
      moved = true;
      ctx.moveTo(x + coords0[0], y - coords0[2]);
    }
    ctx.moveTo(x + coords0[0], y - coords0[2]);
    for (var i = 0; i < subdivisions; i++) {
      var coords1 = getCoords(GeoPoint.interpolate(edge.v0, edge.v1, (i + 1) / subdivisions));

      if (coords1[1] > 0.0) {
        if (moved) {
          ctx.lineTo(x + coords1[0], y - coords1[2]);
        } else {
          moved = true;
          ctx.moveTo(x + coords1[0], y - coords1[2]);
        }
      }

      coords0 = coords1;
    }
    ctx.stroke();
  });*/

  this.tiles.forEach(function(tile) {
    ctx.lineWidth = 2;
    ctx.fillStyle = tile.type == 'land' ? '#51d800' : (tile.type == 'water' ? '#0091e5' : '#fff');
    ctx.strokeStyle = '#fff';
    ctx.beginPath();

    var coords0 = getCoords(tile.corners[0]);
    var moved;
    if (coords0[1] > 0.0) {
      moved = true;
      ctx.moveTo(x + coords0[0], y - coords0[2]);
    }
    tile.corners.forEach(function(v0, i) {
      var v1 = i < tile.corners.length - 1 ? tile.corners[i + 1] : tile.corners[0];
      for (var i = 0; i < subdivisions; i++) {
        var coords1 = getCoords(GeoPoint.interpolate(v0, v1, (i + 1) / subdivisions));

        if (coords1[1] > 0.0) {
          if (moved) {
            ctx.lineTo(x + coords1[0], y - coords1[2]);
          } else {
            moved = true;
            ctx.moveTo(x + coords1[0], y - coords1[2]);
          }
        }

        coords0 = coords1;
      }
    });
    ctx.fill();
    ctx.stroke();
  });

  //θ = atan2(sin(lng2-lng1)*cos(lat2), cos(lat1)*sin(lat2) − sin(lat1)*cos(lat2)*cos(lng2-lng1))
  /*this.edges.forEach(function(edge) {
    var coords0 = getCoords(edge.v0);
    var coords1 = getCoords(edge.v1);
    if (coords0[1] > 0.0 && coords1[1] > 0.0) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(x + coords0[0], y - coords0[2]);
      ctx.lineTo(x + coords1[0], y - coords1[2]);
      ctx.stroke();
    }
  });*/

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.stroke();

  ctx.strokeStyle = '#c00';
  ctx.beginPath();
  for (var i = 0; i < subdivisions; i++) {
    var coords = getCoords(new GeoPoint(null, Math.PI * i / subdivisions, 0.0));
    if (coords[1] > 0.0) {
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalAlpha = 0.3;
    }
    if (i == 0) {
      ctx.moveTo(x + coords[0], y - coords[2]);
    } else {
      ctx.lineTo(x + coords[0], y - coords[2]);
    }
  }
  ctx.stroke();

  this.debugRender && this.debugRender(ctx, x, y, radius, angle);
}
