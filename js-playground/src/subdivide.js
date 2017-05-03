// Make a cut in tile starting from given vertex
Globe.prototype.cut = function(tile, v0, v1) {
  // Find second vertex
  var i0 = tile.corners.indexOf(v0);
  var i1;
  if (!v1) {
    i1 = (i0 + ~~(tile.corners.length / 2)) % tile.corners.length;
    v1 = tile.corners[i1];
  } else {
    i1 = tile.corners.indexOf(v1);
  }

  var d0 = new GeoTile(rng, false);
  var d1 = new GeoTile(rng, false);
  var edge = new GeoEdge(v0, v1, d0, d1, true);
  this.tiles.splice(this.tiles.indexOf(tile), 1, d0, d1);
  this.edges.push(edge);

  // d0 part
  for (var i = i0; i != i1; i = (i + 1) % tile.corners.length) {
    var e = tile.borders[i];
    if (e.d0 == tile) {
      if (d0.neighbors.indexOf(e.d1) == -1) {
        d0.neighbors.push(e.d1);
      }
      if (e.d1.neighbors.indexOf(tile) > -1) {
        e.d1.neighbors.splice(e.d1.neighbors.indexOf(tile), 1);
      }
      if (e.d1.neighbors.indexOf(d0) == -1) {
        e.d1.neighbors.push(d0);
      }
      e.d0 = d0;
    } else {
      if (d0.neighbors.indexOf(e.d0) == -1) {
        d0.neighbors.push(e.d0);
      }
      if (e.d0.neighbors.indexOf(tile) > -1) {
        e.d0.neighbors.splice(e.d0.neighbors.indexOf(tile), 1);
      }
      if (e.d0.neighbors.indexOf(d0) == -1) {
        e.d0.neighbors.push(d0);
      }
      e.d1 = d0;
    }
    d0.corners.push(tile.corners[i]);
    d0.borders.push(e);

    tile.corners[i].touches.splice(tile.corners[i].touches.indexOf(tile), 1, d0);
  }
  v1.touches.push(d0);
  v1.protrudes.push(edge);
  v1.adjacent.push(v0);
  d0.neighbors.push(d1);
  d0.corners.push(v1);
  d0.borders.push(edge);

  // d1 part
  for (var i = i1; i != i0; i = (i + 1) % tile.corners.length) {
    var e = tile.borders[i];
    if (e.d0 == tile) {
      if (d1.neighbors.indexOf(e.d1) == -1) {
        d1.neighbors.push(e.d1);
      }
      if (e.d1.neighbors.indexOf(tile) > -1) {
        e.d1.neighbors.splice(e.d1.neighbors.indexOf(tile), 1);
      }
      if (e.d1.neighbors.indexOf(d1) == -1) {
        e.d1.neighbors.push(d1);
      }
      e.d0 = d1;
    } else {
      if (d1.neighbors.indexOf(e.d0) == -1) {
        d1.neighbors.push(e.d0);
      }
      if (e.d0.neighbors.indexOf(tile) > -1) {
        e.d0.neighbors.splice(e.d0.neighbors.indexOf(tile), 1);
      }
      if (e.d0.neighbors.indexOf(d1) == -1) {
        e.d0.neighbors.push(d1);
      }
      e.d1 = d1;
    }
    d1.corners.push(tile.corners[i]);
    d1.borders.push(e);

    tile.corners[i].touches.splice(tile.corners[i].touches.indexOf(tile), 1, d1);
  }
  v0.touches.push(d1);
  v0.protrudes.push(edge);
  v0.adjacent.push(v1);
  d1.neighbors.push(d0);
  d1.corners.push(v0);
  d1.borders.push(edge);
  this.validate();

  return [d0, d1, edge];
}

// Make a cut in edge (at position pos, by default 0.5)
// Returns new vertex (midpoint)
Globe.prototype.split = function(edge, pos) {
  // Create midpoint
  var pos = pos || 0.5;//  0.5 + this.rng.floatBetween(-0.1, 0.1)

  var mid = GeoVertex.interpolate(edge.v0, edge.v1, pos);
  this.verts.push(mid);

  // Replace an old edge with two new edges
  var edge0 = new GeoEdge(edge.v0, mid, edge.d0, edge.d1, true);
  var edge1 = new GeoEdge(mid, edge.v1, edge.d0, edge.d1, true);
  this.edges.push(edge0);
  this.edges.push(edge1);

  mid.adjacent = [edge.v0, edge.v1];
  mid.touches = [edge.d0, edge.d1];
  mid.protrudes = [edge0, edge1];
  edge.v0.adjacent.splice(edge.v0.adjacent.indexOf(edge.v1), 1, mid);
  edge.v1.adjacent.splice(edge.v1.adjacent.indexOf(edge.v0), 1, mid);
  // touches is unchanged
  edge.v0.protrudes.splice(edge.v0.protrudes.indexOf(edge), 1, edge0);
  edge.v1.protrudes.splice(edge.v1.protrudes.indexOf(edge), 1, edge1);

  var d0 = edge.d0;
  for (var i = 0; i < d0.corners.length; i++) {
    var v0 = d0.corners[i];
    var v1 = d0.corners[(i + 1) % d0.corners.length];
    if (v0 == edge.v0 && v1 == edge.v1)  {
      d0.corners.splice(i + 1, 0, mid);
      d0.borders.splice(i, 1, edge0, edge1);
      // neighbors is unchanged
      break;
    } else
    if (v0 == edge.v1 && v1 == edge.v0) {
      d0.corners.splice(i + 1, 0, mid);
      d0.borders.splice(i, 1, edge1, edge0);
      // neighbors is unchanged
      break;
    }
  }
  var d1 = edge.d1;
  for (var i = 0; i < d1.corners.length; i++) {
    var v0 = d1.corners[i];
    var v1 = d1.corners[(i + 1) % d1.corners.length];
    if (v0 == edge.v0 && v1 == edge.v1)  {
      d1.corners.splice(i + 1, 0, mid);
      d1.borders.splice(i, 1, edge0, edge1);
      // neighbors is unchanged
      break;
    } else
    if (v0 == edge.v1 && v1 == edge.v0) {
      d1.corners.splice(i + 1, 0, mid);
      d1.borders.splice(i, 1, edge1, edge0);
      // neighbors is unchanged
      break;
    }
  }

  this.validate();
  return mid;
}

Globe.prototype.octagon = function() {
  this.verts = [];
  this.edges = [];
  this.tiles = [];
  GeoTile._next = 0;

  this.verts.push(new GeoVertex(rng, 0.0, 0.0));
  this.verts.push(new GeoVertex(rng, Math.PI, 0.0));

  this.verts.push(new GeoVertex(rng, Math.PI / 2, 0.0));
  this.verts.push(new GeoVertex(rng, Math.PI / 2, 2 * Math.PI / 3));
  this.verts.push(new GeoVertex(rng, Math.PI / 2, 4 * Math.PI / 3));

  this.tiles.push(new GeoTile(rng, false));
  this.tiles.push(new GeoTile(rng, false));
  this.tiles.push(new GeoTile(rng, false));
  this.tiles.push(new GeoTile(rng, false));
  this.tiles.push(new GeoTile(rng, false));
  this.tiles.push(new GeoTile(rng, false));

  this.edges.push(new GeoEdge(this.verts[0], this.verts[2], this.tiles[2], this.tiles[0]));
  this.edges.push(new GeoEdge(this.verts[0], this.verts[3], this.tiles[0], this.tiles[1]));
  this.edges.push(new GeoEdge(this.verts[0], this.verts[4], this.tiles[1], this.tiles[2]));
  this.edges.push(new GeoEdge(this.verts[1], this.verts[4], this.tiles[3], this.tiles[4]));
  this.edges.push(new GeoEdge(this.verts[1], this.verts[3], this.tiles[4], this.tiles[5]));
  this.edges.push(new GeoEdge(this.verts[1], this.verts[2], this.tiles[5], this.tiles[3]));
  this.edges.push(new GeoEdge(this.verts[2], this.verts[3], this.tiles[5], this.tiles[0]));
  this.edges.push(new GeoEdge(this.verts[3], this.verts[4], this.tiles[4], this.tiles[1]));
  this.edges.push(new GeoEdge(this.verts[4], this.verts[2], this.tiles[3], this.tiles[2]));

  // Fix verts/edges order (hacky!)
  this.tiles[2].corners = [this.verts[0], this.verts[4], this.verts[2]];
  this.tiles[3].corners = [this.verts[1], this.verts[2], this.verts[4]];
  // Other corners are in correct order

  this.tiles[0].borders = [this.edges[0], this.edges[6], this.edges[1]];
  this.tiles[1].borders = [this.edges[1], this.edges[7], this.edges[2]];
  this.tiles[2].borders = [this.edges[2], this.edges[8], this.edges[0]];
  this.tiles[3].borders = [this.edges[5], this.edges[8], this.edges[3]];
  this.tiles[4].borders = [this.edges[3], this.edges[7], this.edges[4]];
  this.tiles[5].borders = [this.edges[4], this.edges[6], this.edges[5]];

  this.tiles.forEach(function(tile, i) {
    console.log('Tile ', tile.id, ':');
    console.log(tile.corners.map((vert) => vert.id).join(' - '));
    console.log(tile.borders.map((edge) => edge.id).join(' - '));
  });
  this.validate();
}

Globe.prototype.subdivide = function(maxlen, maxsides, splits, cuts, displace) {
  var splitted = false;
  var num = 0;
  while (true) {
    var longest = null;
    var self = this;
    this.edges.forEach(function(edge, i) {
      //if (edge.len() <= maxlen * 0.4 && edge.)
      if (!cuts && edge.d0.type == edge.d1.type) return;
      if (longest === null || edge.len() > self.edges[longest].len()) {
        longest = i;
      }
    });

    if (longest === null || this.edges[longest].len() < maxlen) {
      break;
    }

    // Subdivide this.edges[longest]

    if (splits) {
      var edge = this.edges.splice(longest, 1)[0];
      var mid = this.split(edge, this.rng.floatBetween(0.3, 0.7));
    }


    if (cuts) {
      if (this.rng.floatBetween(0.0, 1.0) < 0.9 || edge.d0.corners.length > maxsides) {
        this.cut(edge.d0, mid);
      }

      if (this.rng.floatBetween(0.0, 1.0) < 0.9 || edge.d1.corners.length > maxsides) {
        this.cut(edge.d1, mid);
      }
    }

    // Add displacement?
    /*var rough = 0.01;
    var lat = edge.len() *edge.len() * this.rng.floatBetween(-rough, rough);
    var lng = edge.len() *edge.len() * this.rng.floatBetween(-rough, rough);
    mid.lat += lat;
    mid.lng += lng;*/
    if (displace) {
      lat = edge.len() * this.rng.floatBetween(-displace, displace);
      lng = edge.len() * this.rng.floatBetween(-displace, displace);
      mid.lat += lat;
      mid.lng += lng;
    }

    //if (num++ > 30) break;
  }
}

Globe.prototype.flood = function() {
  var queue = [];
  for (var i = 0; i < 8; i++) {
    var idx = ~~(Math.random() * this.tiles.length);
    this.tiles[idx].type = 'water';
    queue.push(this.tiles[idx]);
  }
  for (var i = 0; i < 3; i++) {
    var idx = ~~(Math.random() * this.tiles.length);
    this.tiles[idx].type = 'land';
    queue.push(this.tiles[idx]);
  }

  while (queue.length) {
    var next = queue.pop();
    for (var i = 0; i < next.neighbors.length; i++) {
      if (!next.neighbors[i].type && (Math.random() < 0.7)) {
        next.neighbors[i].type = next.type;
        queue.unshift(next.neighbors[i]);
      }
    }

    // check if there's some unflooded tiles left
    if (!queue.length) {
      for (var i = 0; i < this.tiles.length; i++) {
        if (!this.tiles[i].type) {
          this.tiles[i].type = (Math.random() < 0.8 ? 'land' : 'water');
          queue.push(this.tiles[i]);
          break;
        }
      }
    }
  }
}
