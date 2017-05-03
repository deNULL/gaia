Globe.prototype.voronoi = function(fast) {
  var globe = this;
  var lastA, lastB;

  // reset graph
  globe.verts = [];
  globe.edges = [];
  globe.tiles.forEach(function(tile) {
    tile.neighbors = [];
    tile.borders = [];
    tile.corners = [];
  });

  // находим точку пересечения эллипсов a, b
  // нужно только для отладки
  function intersect(vert, next) {
    var r = sweepLat;
    var a =
      (Math.cos(r) - Math.cos(next.lat)) * Math.sin(vert.lat) * Math.cos(vert.lng) -
      (Math.cos(r) - Math.cos(vert.lat)) * Math.sin(next.lat) * Math.cos(next.lng);
    var b =
      (Math.cos(r) - Math.cos(next.lat)) * Math.sin(vert.lat) * Math.sin(vert.lng) -
      (Math.cos(r) - Math.cos(vert.lat)) * Math.sin(next.lat) * Math.sin(next.lng);
    var gamma = Math.atan2(a, b);
    var dt = (Math.cos(vert.lat) - Math.cos(next.lat)) * Math.sin(r);
    //var sign = (next.lng > vert.lng) ? -1 : 1;

    var lng1 = Math.asin(dt / Math.sqrt(a * a + b * b)) - gamma;
    var lng2 = Math.asin(-dt / Math.sqrt(a * a + b * b)) - gamma;
    if (lng1 < 0) {
      lng1 += 2 * Math.PI;
    }
    if (lng2 < 0) {
      lng2 += 2 * Math.PI;
    }
    if (lng1 > 2 * Math.PI) {
      lng1 -= 2 * Math.PI;
    }
    if (lng2 > 2 * Math.PI) {
      lng2 -= 2 * Math.PI;
    }
    var lat1 = Math.atan2(Math.cos(vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(vert.lat) * Math.cos(vert.lng - lng1));
    var lat2 = Math.atan2(Math.cos(vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(vert.lat) * Math.cos(vert.lng - lng2));
    //console.log(lat1 > lat2);
    return new GeoPoint(null, lat1, lng1);
  }
  window.intersect = intersect;
  window.printBeach = function() {
    console.log('beach:');
    var list = [];
    beach.each(function(node) {
      var l = intersect(node.prev ? node.prev.vert : beach.tail.vert, node.vert);
      var r = intersect(node.vert, node.next ? node.next.vert : beach.head.vert);
      list.push('<(' + l.lat.toFixed(3) + ',' + l.lng.toFixed(3) + ') ' +
        node.vert.code + ' (lat = ' + node.vert.lat.toFixed(3) + ', lng = ' + node.vert.lng.toFixed(3) + ')' +
        ' (' + r.lat.toFixed(3) + ',' + r.lng.toFixed(3) + ')>');
    });
    console.log(list.join('\n'));
  }
  // определяем, с какой стороны от пересечения эллипсов a, b находится меридиан, которому принадлежит точка p
  function compareWithIntersection(p, a, b) {
    /*var α = p.x * (p.x - a.x) + p.y * (p.y - a.y);
    var β = p.x * (p.x - b.x) + p.y * (p.y - b.y);
    var result = β * Math.abs(a.z - p.z) - α * Math.abs(b.z - p.z);
    return result;*/
    // жесть, надо упрощать
    var I = intersect(a.vert, b.vert);
    if (a.vert.lng > b.vert.lng) { // пересекаем нулевой меридиан
      if (I.lng > a.vert.lng) { // пересечение до нулевого меридиана
        if (p.vert.lng < b.vert.lng) {
          return 1;
        } else
        if (p.vert.lng > I.lng) {
          return 1;
        } else {
          return -1;
        }
      } else { // пересечение после
        if (p.vert.lng > a.vert.lng) {
          return -1;
        } else
        if (p.vert.lng < I.lng) {
          return -1;
        } else
        if (p.vert.lng < b.vert.lng) {
          return 1;
        } else {
          return -1;
        }
      }
    } else {
      if (p.vert.lng < a.vert.lng) {
        return -1;
      } else
      if (p.vert.lng > b.vert.lng) {
        return 1;
      } else {
        if (p.vert.lng < I.lng) {
          return -1;
        } else {
          return 1;
        }
      }
    }

    //var pt = intersect(a.vert, b.vert);
    //return p.vert.lng - pt.lng;
    /*var r = sweepLat;
    if (a.vert.lng > b.vert.lng) {
      if (a.vert.lng >= 0 && a.vert.lng + Math.PI <= 2 * Math.PI) {
        // prime meridian ∉ a+
        if (p.vert.lng < a.vert.lng) {
          return -1;
        } else
        if (p.vert.lng > a.vert.lng + Math.PI) {
          return 1;
        } else {
          var epsA = Math.atan2(Math.cos(a.vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(a.vert.lat) * Math.cos(a.vert.lng - p.vert.lng));
          var epsB = Math.atan2(Math.cos(b.vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(b.vert.lat) * Math.cos(b.vert.lng - p.vert.lng));
          return epsA - epsB;
        }
      } else {
        var pt = intersect(a.vert, b.vert);
        if (pt.lng > a.vert.lng) {
          if (p.vert.lng < a.vert.lng) {
            return -1;
          } else {
            var epsA = Math.atan2(Math.cos(a.vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(a.vert.lat) * Math.cos(a.vert.lng - p.vert.lng));
            var epsB = Math.atan2(Math.cos(b.vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(b.vert.lat) * Math.cos(b.vert.lng - p.vert.lng));
            return epsA - epsB;
          }
        } else {
          if (p.vert.lng > a.vert.lng - Math.PI) {
            return 1;
          } else {
            var epsA = Math.atan2(Math.cos(a.vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(a.vert.lat) * Math.cos(a.vert.lng - p.vert.lng));
            var epsB = Math.atan2(Math.cos(b.vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(b.vert.lat) * Math.cos(b.vert.lng - p.vert.lng));
            return epsA - epsB;
          }
        }
      }
    } else {
      return -compareWithIntersection(p, b, a);
    }*/
  }
  // вставляем кусок береговой линии, разрезая им существующий (above)
  function insertBeachArc(above, node) {
    var copy = {
      vert: above.vert,
      tile: above.tile,
      x: above.x, y: above.y, z: above.z
    }
    lastA = above;
    lastB = copy;

    if (above.circle && !above.circle.passed) {
      // circle-event is false alarm, remove it
      above.circle.passed = true;
      queue.remove(above.circle);
      delete above.circle;
    }
    var first = (above === beach.head);
    //var last = (above === beach.tail);

    var inserted = false;
    if (first && above.next) {
      /*var I = intersect(above.vert, above.next.vert);
      if (node.vert.lng > I.lng) {
        beach.insertAfter(beach.tail, copy);
        beach.insertAfter(copy, node);
        inserted = true;
      }*/

      var I = intersect(above.vert, above.next.vert);
      if (node.vert.lng > I.lng) { // до нулевого меридиана
        beach.insertAfter(beach.tail, copy);
        beach.insertAfter(copy, node);
        inserted = true;
      }
    }
    /* else
    if (last && above.prev) {
      var I = intersect(beach.tail.vert, beach.head.vert);
      if (node.vert.lng > I.lng) {
        beach.insertAfter(null, node);
        beach.insertAfter(node, copy);
        inserted = true;
      }
    }*/

    if (!inserted) {
      beach.insertAfter(above, node);
      beach.insertAfter(node, copy);
    }

    //if (first/* || last*/) {
      checkRollEvent();
    //}

    // определяем, когда разрезанные куски эллипса схлопнутся (случится circle-event)
    checkCircleEvent(above.prev || beach.tail, above, above.next || beach.head);
    checkCircleEvent(node.prev || beach.tail, node, node.next || beach.head);
    checkCircleEvent(copy.prev || beach.tail, copy, copy.next || beach.head);
  }
  function deleteRollEvents() {
    // drop old roll event
    var head = beach.head;
    //var tail = beach.tail;
    if (head.roll && !head.roll.passed) {
      head.roll.passed = true;
      queue.remove(head.roll);
      delete head.roll;
    }
    /*if (tail.roll && !tail.roll.passed) {
      tail.roll.passed = true;
      queue.remove(tail.roll);
      delete tail.roll;
    }*/
  }
  function checkRollEvent() {
    // drop old roll event
    var v2 = beach.head.next || beach.tail;
    var v1 = beach.head;
    var v0 = beach.tail;
    deleteRollEvents();

    //var a = v0.vert.toCoords(1.0);
    //var b = v1.vert.toCoords(1.0);
    //var c = v2.vert.toCoords(1.0);

    var b = v0.vert.toCoords(1.0);
    var a = v1.vert.toCoords(1.0);
    var len1 = Math.sqrt((a[2] - b[2]) * (a[2] - b[2]) + (b[0] - a[0]) * (b[0] - a[0]));
    var lat1 = Math.acos((a[0] - b[0]) / len1) + Math.acos(b[0] * (b[2] - a[2]) / len1 + b[2] * (a[0] - b[0]) / len1);

    var c = v1.vert.toCoords(1.0);
    b = v2.vert.toCoords(1.0);
    var len2 = Math.sqrt((b[2] - c[2]) * (b[2] - c[2]) + (c[0] - b[0]) * (c[0] - b[0]));
    var lat2 = Math.acos((b[0] - c[0]) / len2) + Math.acos(c[0] * (c[2] - b[2]) / len2 + c[2] * (b[0] - c[0]) / len2);

    console.log('<' + v0.vert.code + ',' + v1.vert.code + '> at ' + lat1.toFixed(4));
    console.log('<' + v1.vert.code + ',' + v2.vert.code + '> at ' + lat2.toFixed(4));

    if ((lat2 > sweepLat) && (lat1 > lat2)/* && (lat1 < sweepLat || lat1 > lat2)*/) {

      var roll = {
        key: lat2,//p,
        lat: lat2,
        dir: true,
        roll: v1.vert
      }
      v1.roll = roll;
      queue.insert(roll);
    }
    if ((lat1 > sweepLat)/* && (lat2 < sweepLat || lat2 > lat1)*/) {
      var roll = {
        key: lat1,//p,
        lat: lat1,
        dir: false,
        roll: v1.vert
      }
      v1.roll = roll;
      queue.insert(roll);
    }

    /*if (lat > sweepLat) {
      var cur = intersect(tail.vert, head.vert);
      var next = intersect(head.vert, head.next ? head.next.vert : tail.vert);
      var dir = (cur.lng < next.lng); // moving from head?
      // otherwise cur.lng > tail.vert.lng

      var roll = {
        key: lat,//p,
        lat: lat,
        dir: dir,
        roll: [head.vert, tail.vert]
      }
      head.roll = tail.roll = roll;
      queue.insert(roll);
    }*/
  }
  function checkCircleEvent(a, b, c) {
    //return;
    if (b.circle && !b.circle.passed) {
      b.circle.passed = true;
      queue.remove(b.circle);
      delete b.circle;
    }

    // возможно, эллипс b схлопнется в точку эллипсами a и c
    var vx = (a.y - b.y) * (c.z - b.z) - (a.z - b.z) * (c.y - b.y);
    var vy = (a.z - b.z) * (c.x - b.x) - (a.x - b.x) * (c.z - b.z);
    var vz = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);

    var len2 = vx * vx + vy * vy + vz * vz;
    var len = Math.sqrt(len2);

    // maybe unneeded?
    var lat = Math.acos(vz / len) + Math.acos(a.x * vx / len + a.y * vy / len + a.z * vz / len);

    var r = vx * a.x + vy * a.y + vz * a.z;

    var p = -(len2 + r * vz - Math.sqrt((len2 - vz * vz) * (len2 - r * r))) / len2;
    //var z = -(1 + (new GeoPoint(null, lat, 0.0)).toCoords(1.0)[2]);
    //console.log(z, p);
    if (lat > sweepLat) {
      var circle = {
        key: lat,//p,
        lat: lat,
        circle: [a, b, c],
        center: [vx, vy, vz]
      }
      b.circle = circle;
      queue.insert(circle);
    }
  }
  function halfEdge(d0, d1, v) {
    for (var i = 0; i < d0.borders.length; i++) {
      if ((d0.borders[i].d0 === d1) || (d0.borders[i].d1 === d1)) {
        var edge = d0.borders[i];
        edge.v1 = v;

        if (v.touches.indexOf(d0) == -1) {
          v.touches.push(d0);
        }
        if (v.touches.indexOf(d1) == -1) {
          v.touches.push(d1);
        }

        v.protrudes.push(edge);
        v.adjacent.push(edge.v0);
        edge.v0.adjacent.push(v);

        if (d0.corners.indexOf(v) == -1) {
          d0.corners.push(v);
        }
        if (d1.corners.indexOf(v) == -1) {
          d1.corners.push(v);
        }
        return;
      }
    }

    // existing half edge not found, add silently
    var edge = new GeoEdge(v, null, d0, d1, true);
    globe.edges.push(edge);

    v.touches.push(d0);
    v.touches.push(d1);
    v.protrudes.push(edge);

    d0.neighbors.push(d1);
    d0.borders.push(edge);
    d0.corners.push(v);

    d1.neighbors.push(d0);
    d1.borders.push(edge);
    d1.corners.push(v);
  }
  function deleteCircleEvents(a, b, c) {
    /*if (a.circle && !a.circle.passed &&
      ((a.circle.circle[0] === b && a.circle.circle[2] === c) ||
       (a.circle.circle[0] === c && a.circle.circle[2] === b))) {
      a.circle.passed = true;
      queue.remove(a.circle);
      delete a.circle;
    }
    if (b.circle && !b.circle.passed &&
      ((b.circle.circle[0] === a && b.circle.circle[2] === c) ||
       (b.circle.circle[0] === c && b.circle.circle[2] === a))) {
      b.circle.passed = true;
      queue.remove(b.circle);
      delete b.circle;
    }
    if (c.circle && !c.circle.passed &&
      ((c.circle.circle[0] === b && c.circle.circle[2] === a) ||
       (c.circle.circle[0] === a && c.circle.circle[2] === b))) {
      c.circle.passed = true;
      queue.remove(c.circle);
      delete c.circle;
    }*/
    if (b.circle && !b.circle.passed) {
      b.circle.passed = true;
      queue.remove(b.circle);
      delete b.circle;
    }
  }
  function validateHeadTail() {
    if (beach.tail && beach.tail.prev) {
      var pos1 = intersect(beach.tail.prev.vert, beach.tail.vert);
      var pos2 = intersect(beach.tail.vert, beach.head.vert);
      if (pos2.lng < pos1.lng) {
        var tail = beach.tail;
        beach.remove(tail);
        beach.insertAfter(null, tail);
      } else {
        var pos3 = intersect(beach.head.vert, beach.head.next.vert);
        if (pos2.lng < pos3.lng) {
          var head = beach.head;
          beach.remove(head);
          beach.insertAfter(beach.tail, head);
        }
      }
    }
  }
  /*this.tiles.sort(function(t0, t1) {
    return (t1.center.lat - t0.center.lat);
  });*/

/*
  var used = {};
  for (var a = 0; a < this.verts.length; a++) {
    if (used[a]) continue;
    var b, c;
    for (var i = 0; i < this.verts.length; i++) {
      if (a == i) continue;
      if (b === undefined || this.verts[a].distTo(this.verts[i]) < this.verts[a].distTo(this.verts[b])) {
        b = i;
      }
    }
    for (var i = 0; i < this.verts.length; i++) {
      if (a == i || b == i) continue;
      if (c === undefined || this.verts[a].distTo(this.verts[i]) < this.verts[a].distTo(this.verts[c])) {
        c = i;
      }
    }
    used[a] = used[b] = used[c] = true;
    this.edges.push(new GeoEdge(this.verts[a], this.verts[b]));
    this.edges.push(new GeoEdge(this.verts[b], this.verts[c]));
    this.edges.push(new GeoEdge(this.verts[a], this.verts[c]));
  }
*/

  var queue = new PriorityQueue();
  queue.heapify(this.tiles.map(function(tile, pos) {
    return {
      // key and index are required for priority queue to work
      // we are using Cartesian coords to calc priority (because paper says that's better…)
      key: tile.center.lat,//-(1 + tile.center.toCoords(1.0)[2]), // z
      lat: tile.center.lat,
      pos: pos,
      vert: tile.center,
      tile: tile
    }
  }));


  var event;
  var beach = new RBTree();
  var sweep = -2.0;
  var sweepLat = 0.0;
  var code = 65;
  var iteration = function() {
    if (event = queue.poll()) {
      sweep = event.key;
      sweepLat = event.lat;
      sweep = -(1 + (new GeoPoint(null, sweepLat, 0.0)).toCoords(1.0)[2]);

      validateHeadTail();
      // process event
      if ('vert' in event) {
        event.vert.code = String.fromCharCode(code++);
        console.log(sweepLat.toFixed(3) + ': site event at ' + event.vert.code + ' (lat = ', event.vert.lat.toFixed(3), ', lng = ', event.vert.lng.toFixed(3), ')');
        var coords = event.vert.toCoords(1.0);
        var node = {
          vert: event.vert,
          tile: event.tile,
          x: coords[0], y: coords[1], z: coords[2]
        }

        // если берег пуст, добавить дугу с event.vert
        // если берег не пуст:
        // 1) найти дугу над event.vert
        // 2) разрезать дугу на две (a, c), вставить между ними новую (b)
        // 3) проверить a, b, c и возможно добавить circle-event
        // 4) проверить a, b; b, c и возможно добавить roll-event

        // в красно-черном дереве надо найти дугу эллипса, которая находится над новой точкой
        if (!beach.size) {
          beach.insertAfter(null, node);
        } else
        if (beach.size == 1) {
          /*if (beach.root.vert.lng < node.vert.lng) {
            beach.insertAfter(beach.root, node);
          } else {
            beach.insertAfter(null, node);
          }*/
          beach.insertAfter(beach.root, node);
          checkRollEvent();
        } else {
          var dir = 'left';
          var cur = beach.root;
          var next, prev;
          while (cur) {
            var next = cur.next || beach.head;
            var prev = cur.prev || beach.tail;
            var nextI = intersect(cur.vert, next.vert);
            var prevI = intersect(prev.vert, cur.vert);

            if (nextI.lng > prevI.lng) { // обычная ситуация
              if (node.vert.lng > nextI.lng) { // нам дальше
                if (cur.right) {
                  cur = cur.right;
                  dir = 'right';
                } else {
                  insertBeachArc(next, node);
                  break;
                }
              } else
              if (node.vert.lng < prevI.lng) { // нам назад
                if (cur.left) {
                  cur = cur.left;
                  dir = 'left';
                } else {
                  insertBeachArc(prev, node);
                  break;
                }
              } else { // попали в дугу
                insertBeachArc(cur, node);
                break;
              }
            } else { // специальный случай: пересекаем нулевой меридиан
              if (node.vert.lng > prevI.lng || node.vert.lng < nextI.lng) { // попали
                insertBeachArc(cur, node);
                break;
              } else { // снаружи
                if (dir == 'left') {
                  if (cur.right) {
                    cur = cur.right;
                    dir = 'right';
                  } else {
                    insertBeachArc(next, node);
                    break;
                  }
                } else
                if (dir == 'right') {
                  if (cur.left) {
                    cur = cur.left;
                    dir = 'left';
                  } else {
                    insertBeachArc(prev, node);
                    break;
                  }
                }
              }
            }

            /*
            if (compareWithIntersection(node, cur, next) > 0) {
              if (cur.right) {
                cur = cur.right;
              } else {
                insertBeachArc(next, node);
                break;
              }
            } else
            if (compareWithIntersection(node, prev, cur) < 0) {
              if (cur.left) {
                cur = cur.left;
              } else {
                if (prev === beach.tail) {

                }
                insertBeachArc(prev, node);
                break;
              }
            } else {
              insertBeachArc(cur, node);
              break;
            }
            */
          }

          /*
          var cur = beach.root;
          while (cur) {

            var cmpL = cur.prev ? compareWithIntersection(node, cur.prev, cur) : 1;
            if (cmpL < -1e-9) {
              cur = cur.left;
            } else {
              var cmpR = cur.next ? compareWithIntersection(node, cur, cur.next) : -1;
              if (cmpR > 1e-9) {
                if (!cur.right) {
                  insertBeachArc(cur, node);
                  break;
                }
                cur = cur.right;
              } else {
                if (cmpL < 1e-9) {
                  insertBeachArc(cur.prev, node);
                  break;
                } else
                if (cmpR > -1e-9) {
                  insertBeachArc(cur, node);
                  break;
                } else {
                  insertBeachArc(cur, node);
                  break;
                }
              }
            }
          }
          */
        }
      } else
      if ('roll' in event) {
        // event.roll = [a, b] (2 verts?)
        // перенести (скопировать?) дугу на другой конец берега
        console.log(sweepLat.toFixed(3) + ': roll event!');
        if (event.dir) {
          console.log('<' + event.roll.code + '> → tail');
        } else {
          console.log('head ← <' + event.roll.code + '>');
        }
        if (event.dir) {
          var pos = intersect(beach.head.vert, (beach.head.next || beach.tail).vert);
          delete beach.head.roll;

          if (Math.abs(pos.lng) < 1e-7 || Math.abs(pos.lng - Math.PI * 2) < 1e-7) {
            var head = beach.head;
            beach.remove(head);
            beach.insertAfter(beach.tail, head);

            checkRollEvent();
            printBeach();
          } else {
            console.log('false roll event');
          }
        } else {
          var pos = intersect(beach.tail.vert, beach.head.vert);
          delete beach.head.roll;
          delete beach.tail.roll;

          if (Math.abs(pos.lng) < 1e-7 || Math.abs(pos.lng - Math.PI * 2) < 1e-7) {
            var tail = beach.tail;
            beach.remove(tail);
            beach.insertAfter(null, tail);

            checkRollEvent();
            printBeach();
          } else {
            console.log('false roll event');
          }
        }

      } else
      if ('circle' in event) {
        console.log(sweepLat.toFixed(3) + ': circle event!');
        // event.circle = [a, b, c] (3 verts defining a circle)
        // 1) добавить в диаграмму ребра между <a, b> и <b, c> и вершину в центре круга (с висящим ребром)
        // 2) уничтожить дугу b
        // 3) возможно создать новые circle-event'ы <?, a, c> и <a, c, ?>
        //var a = event.circle[0];
        var b = event.circle[1];
        //var c = event.circle[2];
        var a = b.prev || beach.tail;
        var c = b.next || beach.head;
        console.log('<' + a.vert.code + ',' + b.vert.code + ',' + c.vert.code + '>');
        if (!a.next && !a.prev) throw new Error('non existent A');

        // достраиваем диаграмму
        var len = Math.sqrt(
          event.center[0] * event.center[0] +
          event.center[1] * event.center[1] +
          event.center[2] * event.center[2]
        );
        // добавляем центр кружочка
        var center = new GeoVertex(null,
          Math.acos(event.center[2] / len),
          Math.atan2(event.center[1], event.center[0])
        );
        if (center.lng < 0) {
          center.lng += 2 * Math.PI;
        }
        //console.log(center.toCoords(1.0), [event.center[0] / len, event.center[1] / len, event.center[2] / len]);
        globe.verts.push(center);

        // достраиваем три полу-ребра
        halfEdge(a.tile, b.tile, center);
        halfEdge(b.tile, c.tile, center);
        halfEdge(a.tile, c.tile, center);

        deleteRollEvents();

        // сносим старые круги
        deleteCircleEvents(a.prev || beach.tail, a, b);
        deleteCircleEvents(b, c, c.next || beach.head);
        /*if (a.circle) {
          queue.remove(a.circle);
          delete a.circle;
        }

        if (c.circle) {
          queue.remove(c.circle);
          delete c.circle;
        }*/

        // эллипс уничтожается
        beach.remove(b);

        // возможно, появляются новые круги
        checkCircleEvent(a.prev || beach.tail, a, c);
        checkCircleEvent(a, c, c.next || beach.head);

        validateHeadTail();


        checkRollEvent();

        event.passed = true;
      }

      // проверим монотонность долгот в береге
      /*var cur = beach.head;
      var prev;
      while (cur && cur.next) {
        var next = cur.next;
        var I = intersect(cur.vert, next.vert);
        if (prev) {
          if (I.lng + 1e-7 < prev) {
            throw new Error('longitudes of intersections are non-monotonic');
          }
        } else {
          var I2 = intersect(beach.tail.vert, beach.head.vert);
          if (I.lng > I2.lng + 1e-7) {
            throw new Error('head does not overlap prime meridian');
          }
        }
        prev = I.lng;
        cur = next;
      }*/
    } else {
      clearInterval(intr);
      this.debugRender = null;
    }
  }
  window.intr = iteration;
  window.beach = beach;

  if (fast == 'anim') {
    var intr = setInterval(iteration, 100);
  } else
  if (fast) {
    while (queue.size) {
      iteration();
    }
  } else {

    //var intr = setInterval(iteration, 100);

  }

  this.debugRender = function(ctx, x, y, radius, angle) {
    function getCoords(vert) {
      var lng = vert.lng;
      vert.lng += angle;
      var coords = vert.toCoords(radius);
      vert.lng = lng;
      return coords;
    }

    ctx.fillStyle = '#060';
    ctx.strokeStyle = '#060';

    globe.tiles.forEach(function(tile) {
      var vert = tile.center;
      if (!vert.code) {
        return;
      }
      var coords = getCoords(vert);

      ctx.globalAlpha = (coords[1] > 0.0) ? 1 : 0.1;

      ctx.beginPath();
      ctx.arc(x + coords[0], y - coords[2], 2, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.font = '9px sans-serif';
      ctx.fillText(vert.code, x + coords[0] + 2, y - coords[2] - 2);


      /*if (tile.centroid) {
        var coords = getCoords(tile.centroid);
        ctx.fillStyle = '#e00';
        ctx.beginPath();
        ctx.arc(x + coords[0], y - coords[2], 2, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = '#060';
      }*/
    });

    if (!queue.size) {
      // done
      return;
    }

    // draw sweep line
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x - radius, y - (-sweep - 1) * radius);
    ctx.lineTo(x + radius, y - (-sweep - 1) * radius);
    ctx.stroke();

    var node = beach.head;
    var idx = 0;
    while (node) {
      var vert = node.vert;
      var coords = getCoords(vert);

      ctx.globalAlpha = (coords[1] > 0.0) ? 1 : 0.1;

      //if (idx == 10) {
        // нарисуем эллипс, соответствующий данной точке...
        var segm = 100;
        ctx.lineWidth = node.color ? 0.5 : 0.2;
        ctx.strokeStyle = node.color || '#00a';
        ctx.globalAlpha = 0.2;
        ctx.beginPath();

        var r = sweepLat; // radius of sweep circle, r ∈ [0, π]
        for (var i = 0; i <= segm; i++) {
          var lng = 2 * Math.PI * i / segm; // longitude of a point on ellipse, i_θ ∈ [0, 2π]
          var lat = Math.atan2(Math.cos(vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(vert.lat) * Math.cos(vert.lng - lng)); // colatitude of a point

          var coords = getCoords(new GeoVertex(null, lat, lng));
          if (i == 0) {
            ctx.moveTo(x + coords[0], y - coords[2]);
          } else {
            ctx.lineTo(x + coords[0], y - coords[2]);
          }
        }
        ctx.stroke();
        //console.log(r);
      //}
      ctx.beginPath();
      var lat1 = vert.lat;
      var lat2 = Math.atan2(Math.cos(vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(vert.lat));
      for (var i = 0; i <= segm; i++) {
        var coords = getCoords(new GeoPoint(null, lat1 + (lat2 - lat1) * i / segm, vert.lng));
        if (coords[1] > 0.0) {
          ctx.globalAlpha = 1.0;
        } else {
          ctx.globalAlpha = 0.1;
        }
        if (i == 0) {
          ctx.moveTo(x + coords[0], y - coords[2]);
        } else {
          ctx.lineTo(x + coords[0], y - coords[2]);
        }
      }
      ctx.stroke();

      node = node.next;
      idx++;
    }

    var node = beach.head;
    var idx = 0;
    var plng = false;
    while (node) {
      var prev = node.prev ? node.prev.vert : beach.tail.vert;
      var next = node.next ? node.next.vert : beach.head.vert;
      var vert = node.vert;
      var coords = getCoords(vert);

      var i1 = intersect(prev, vert);
      var i2 = intersect(vert, next);

      plng = i1.lng;
      lng = i2.lng;
      var end = getCoords(i2);

      ctx.fillStyle = '#0c0';
      ctx.globalAlpha = (end[1] > 0.0) ? 1 : 0.1;
      ctx.beginPath();
      ctx.arc(x + end[0], y - end[2], 2, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.fillText('<' + vert.code + ',' + next.code + '>', x + end[0] + 2, y - end[2] - 2);

      if (plng !== false) {
        var segm = 100;
        ctx.lineWidth = 2;
        ctx.strokeStyle = node.color || '#00a';
        ctx.globalAlpha = 1;
        if (node == lastA) {
          ctx.strokeStyle = '#0aa';
        }
        if (node == lastB) {
          ctx.strokeStyle = '#a0a';
        }
        ctx.beginPath();

        function sweepEllipse(src, dst) {
          for (var i = 0; i <= segm; i++) {
            var _lng = src + (dst - src) * i / segm; // longitude of a point on ellipse, i_θ ∈ [0, 2π]
            var _lat = Math.atan2(Math.cos(vert.lat) - Math.cos(r), Math.sin(r) - Math.sin(vert.lat) * Math.cos(vert.lng - _lng)); // colatitude of a point

            var coords = getCoords(new GeoVertex(null, _lat, _lng));
            if (i == 0) {
              ctx.moveTo(x + coords[0], y - coords[2]);
            } else {
              ctx.lineTo(x + coords[0], y - coords[2]);
            }
          }
        }

        if (plng < lng) {
          sweepEllipse(plng, lng);
        } else {
          sweepEllipse(plng, Math.PI * 2);
          sweepEllipse(0, lng);
        }

        ctx.stroke();
      }

      node = node.next;
      plng = lng;
      idx++;
    }
  }
}


// Lloyd's relaxation
// Should be performed after building Voronoi diagram
Globe.prototype.relax = function(amount) {
  this.verts.forEach(function(vert, i) {
    vert.coords = vert.toCoords(1.0);
  });
  this.tiles.forEach(function(tile, i) {
    var x = 0;
    var y = 0;
    var z = 0;
    tile.corners.forEach(function(vert) {
      x += vert.coords[0];
      y += vert.coords[1];
      z += vert.coords[2];
    });

    x /= tile.corners.length;
    y /= tile.corners.length;
    z /= tile.corners.length;

    //var center = tile.center.toCoords(1.0);

    //x = center[0] * (1 - amount) + x * amount;
    //y = center[1] * (1 - amount) + y * amount;
    //z = center[2] * (1 - amount) + z * amount;
    var len = Math.sqrt(x * x + y * y + z * z);

    if (isNaN(Math.acos(z / len)) || isNaN(Math.atan2(y, x))) {
      console.warn('Some NaNs, ignoring');
      var x = 0;
      var y = 0;
      var z = 0;
      tile.corners.forEach(function(vert) {
        console.log(vert.coords);
        x += vert.coords[0];
        y += vert.coords[1];
        z += vert.coords[2];
      });
      x /= tile.corners.length;
      y /= tile.corners.length;
      z /= tile.corners.length;
      console.log('avg = ', x, y, z);
      var len = Math.sqrt(x * x + y * y + z * z);
      console.log('len = ', len);
      console.log(Math.acos(z / len), Math.atan2(y, x));
    } else {
      var pt = new GeoPoint(null, Math.acos(z / len), Math.atan2(y, x));
      if (pt.lng < 0) {
        pt.lng += 2 * Math.PI;
      }

      tile.centroid = pt;
      tile.center = GeoPoint.interpolate(tile.center, pt, amount);
      if (tile.center.lng < 0) {
        tile.center.lng += 2 * Math.PI;
      }
    }
  });
  this.verts.forEach(function(vert, i) {
    delete vert.coords;
  });
}


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

  ctx.globalAlpha = 1;
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'black';
  var subdivisions = 30;
  this.edges.forEach(function(edge) {
    if (!edge.v0 || !edge.v1) {
      // half-edge, ignore
      return;
    }

    // когда точки на противоположных концах света, всё плохо
    // найдем серединку
    /*var mid;
    if (Math.abs(edge.v0.lng + edge.v1.lng - 2 * Math.PI) < 0.1) {
      mid = GeoPoint.interpolate(edge.d0.center, edge.d1.center, 0.5);
    }*/
    var mid;

    ctx.beginPath();

    var coords0 = getCoords(edge.v0);
    var moved;
    if (coords0[1] > 0.0) {
      moved = true;
      ctx.moveTo(x + coords0[0], y - coords0[2]);
    }
    ctx.moveTo(x + coords0[0], y - coords0[2]);
    for (var j = 0; j < (mid ? 2 : 1); j++) {
      for (var i = 0; i < subdivisions; i++) {
        var coords1 = (j == 0) ?
          getCoords(GeoPoint.interpolate(edge.v0, mid || edge.v1, (i + 1) / subdivisions)) :
          getCoords(GeoPoint.interpolate(mid, edge.v1, (i + 1) / subdivisions));

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
    }
    ctx.stroke();
  });


  this.verts.forEach(function(vert, i) {
    var coords = getCoords(vert);

    ctx.globalAlpha = (coords[1] > 0.0) ? 1 : 0.1;

    ctx.beginPath();
    ctx.arc(x + coords[0], y - coords[2], 2, 0, 2 * Math.PI, false);
    ctx.fill();
    //ctx.fillText(i, x + coords[0] + 2, y - coords[2] - 2);
  });

  /*this.tiles.forEach(function(tile) {
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
  });*/

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
      ctx.globalAlpha = 0.1;
    }
    if (i == 0) {
      ctx.moveTo(x + coords[0], y - coords[2]);
    } else {
      ctx.lineTo(x + coords[0], y - coords[2]);
    }
  }
  ctx.stroke();

  ctx.globalAlpha = 1.0;
  this.debugRender && this.debugRender(ctx, x, y, radius, angle);
}
