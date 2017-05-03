var CircularSkiplist = function(levels) {
  this.head = null;
  this.levels = levels || 20;
  this.size = 0;
}

CircularSkiplist.prototype.lookup = function(cmp) {
  if (!this.head) {
    return null;
  }
  var cur = this.head;
  var prev = [];
  for (var level = this.levels - 1; level >= 0; level--) {
    do {
      if (cur.levels[level][1] === cur) {
        break;
      }
      
      var result = cmp(
        cur.levels[level][0], cur, cur.levels[level][1]
      );

      if (result === true) { // exact match, skip further checks
        while (level >= 0) {
          prev.push(cur);
          level--;
        }
        return prev;
      }

      if (result > 0) {
        cur = cur.levels[level][1];
      } else
      if (result < 0) {
        cur = cur.levels[level][0];
      }
    } while (result);

    prev.push(cur);
  }
  return prev;
}

CircularSkiplist.prototype.insertAfter =
CircularSkiplist.prototype.addAfter = function(prev, node) {
  node.levels = [];
  if (this.head) {
    var rnd = (Math.random() * (1 << this.levels)) | 1; // 1st bit should always be on
    if (!this.prev) {
      prev = new Array(this.levels);
    }
    for (var i = 0; (i < this.levels) && (rnd & (1 << i)); i++) {
      var p = prev[this.levels - i - 1] || this.head;
      node.levels.push([p, p.levels[i][1]]);
      prev[this.levels - i - 1] =
        p.levels[i][1] =
        p.levels[i][1].levels[i][0] = node;
    }
  } else {
    this.head = node;
    prev = new Array(this.levels);
    for (var i = 0; i < this.levels; i++) {
      node.levels.push([node, node]);
      prev[this.levels - i - 1] = node;
    }
  }
  this.size++;
  return prev;
}

CircularSkiplist.prototype.remove = function(node) {
  if (!node.levels) {
    console.warn('node ', node, ' is already deleted');
    return;
  }
  this.size--;
  for (var i = 0; i < node.levels.length; i++) {
    node.levels[i][0].levels[i][1] = node.levels[i][1];
    node.levels[i][1].levels[i][0] = node.levels[i][0];
  }
  if (node === this.head) {
    this.head = this.size ? node.levels[this.levels - 1][1] : null;
  }
  delete node.levels;
}
