'use strict';
// Red-black tree implementation
// Based on https://github.com/vadimg/js_bintrees
// Added minor tweaks, changed name conventions, removed comparators, helper classes
// Merged with https://github.com/gorhill/Javascript-Voronoi/blob/master/rhill-voronoi-core.js#L140
// (adding/removing nodes w/o keys)

function RBTree() {
  this.root = null;
  this.head = null;
  this.tail = null;
  this.size = 0;
}

// Utils
RBTree.singleRotate = function(root, dir) {
  var node = root[dir ? 'left' : 'right'];
  root[dir ? 'left' : 'right'] = node[dir ? 'right' : 'left'];
  node[dir ? 'right' : 'left'] = root;
  root.red = true;
  node.red = false;
  return node;
}

RBTree.doubleRotate = function(root, dir) {
  root[dir ? 'left' : 'right'] = this.singleRotate(root[dir ? 'left' : 'right'], !dir);
  return this.singleRotate(root, dir);
}

// returns true if inserted, false if duplicate
// node MUST contain a `key` field for comparisons
// node MUST NOT contain a `left`, `right` or `red` fields
RBTree.prototype.insert = RBTree.prototype.add = function(node) {
  var ret = false;
  node.red = true;

  if (!this.root) {
    this.root = node;
    ret = true;
    this.size++;
  } else {
    var head = { red: true };

    var dir, dir2, last;

    var p, gp;
    var ggp = head;
    var cur = this.root;
    ggp.right = this.root;

    // search down
    while (true) {
      if (!cur) {
        // insert new node at the bottom
        cur = node;
        p[dir ? 'right' : 'left'] = cur;
        ret = true;
        this.size++;
      } else
      if (cur.left && cur.left.red && cur.right && cur.right.red) {
        // color flip
        cur.red = true;
        cur.left.red = cur.right.red = false;
      }

      // fix red violation
      if (cur.red && p && p.red) {
        dir2 = ggp.right === gp;
        if (cur === p[last ? 'right' : 'left']) {
          ggp[dir2 ? 'right' : 'left'] = RBTree.singleRotate(gp, !last);
        } else {
          ggp[dir2 ? 'right' : 'left'] = RBTree.doubleRotate(gp, !last);
        }
      }

      // stop if found
      if (cur.key == node.key) {
        break;
      }
      last = dir;
      dir = (cur.key < node.key);
      if (gp) {
        ggp = gp;
      }
      gp = p;
      p = cur;
      cur = cur[dir ? 'right' : 'left'];
    }

    this.root = head.right;
  }

  this.root.red = false;
  return ret;
}

// inserting relative to given node
// key is not required here
// based on https://github.com/gorhill/Javascript-Voronoi/blob/master/rhill-voronoi-core.js#L140
RBTree.prototype.insertAfter = RBTree.prototype.addAfter = function(base, node) {
  this.size++;

  var p;

  if (base) {
    node.prev = base;
    node.next = base.next;

    if (base.next) {
      base.next.prev = node;
    }

    base.next = node;

    if (this.tail == base) {
      this.tail = node;
    }

    if (base.right) {
      base = base.right;
      while (base.left) {
        base = base.left;
      }
      base.left = node;
    } else {
      base.right = node;
    }


    p = base;
  } else
  if (this.root) { // base = null, insert as leftmost node
    base = this.head;
    node.prev = null;
    node.next = base;
    this.head = base.prev = base.left = node;
    p = base;
  } else {
    node.prev = node.next = null;
    this.root = this.head = this.tail = node;
    p = null;
  }

  node.left = node.right = null;
  node.parent = p;
  node.red = true;

  // Fixup the modified tree by recoloring nodes and performing
  // rotations (2 at most) hence the red-black tree properties are
  // preserved.
  var gp;
  while (p && p.red) {
    gp = p.parent;
    if (p === gp.left) {
      if (gp.right && gp.right.red) {
        p.red = gp.right.red = false;
        gp.red = true;
        node = gp;
      } else {
        if (node === p.right) {
          this.rotateLeft(p);
          node = p;
          p = node.parent;
        }
        p.red = false;
        gp.red = true;
        this.rotateRight(gp);
      }
    } else {
      if (gp.left && gp.left.red) {
        p.red = gp.left.red = false;
        gp.red = true;
        node = gp;
      } else {
        if (node === p.left) {
          this.rotateRight(p);
          node = p;
          p = node.parent;
        }
        p.red = false;
        gp.red = true;
        this.rotateLeft(gp);
      }
    }
    p = node.parent;
  }
  this.root.red = false;
}

// Probably same as RBTree.singleRotate(node, false)
RBTree.prototype.rotateLeft = function(node) {
  var p = node,
      q = node.right,
      parent = p.parent;

  if (parent) {
    if (parent.left === p) {
      parent.left = q;
    } else {
      parent.right = q;
    }
  } else {
    this.root = q;
  }
  q.parent = parent;
  p.parent = q;
  p.right = q.left;
  if (p.right) {
    p.right.parent = p;
  }
  q.left = p;
}

// Probably same as RBTree.singleRotate(node, true)
RBTree.prototype.rotateRight = function(node) {
  var p = node,
      q = node.left,
      parent = p.parent;
  if (parent) {
    if (parent.left === p) {
      parent.left = q;
    } else {
      parent.right = q;
    }
  } else {
    this.root = q;
  }
  q.parent = parent;
  p.parent = q;
  p.left = q.right;
  if (p.left) {
    p.left.parent = p;
  }
  q.right = p;
}

// returns true if removed, false if not found
RBTree.prototype.removeByKey = function(key) {
  if (!this.root) {
    return false;
  }

  var head = { red: true };
  var cur = head;
  cur.right = this.root;
  var p, gp, found, last, tmp, dir2;

  var dir = true;
  while (cur[dir ? 'right' : 'left']) {
    last = dir;

    // update helpers
    gp = p;
    p = cur;
    cur = cur[dir ? 'right' : 'left'];

    dir = key > cur.key;

    // save found node
    if (key == cur.key) {
      found = cur;
    }

    // push the red node down
    if (!cur.red && (!cur[dir ? 'right' : 'left'] || !cur[dir ? 'right' : 'left'].red)) {
      if (cur[dir ? 'left' : 'right'] && cur[dir ? 'left' : 'right'].red) {
        tmp = RBTree.singleRotate(cur, dir);
        p[last ? 'right' : 'left'] = tmp;
        p = tmp;
      } else {
        tmp = p[last ? 'left' : 'right'];
        if (tmp) {
          if ((!tmp[last ? 'left' : 'right'] || !tmp[last ? 'left' : 'right'].red) &&
              (!tmp[last ? 'right' : 'left'] || !tmp[last ? 'right' : 'left'].red)) {
            p.red = false;
            cur.red = tmp.red = true;
          } else {
            dir2 = gp.right === p;
            if (tmp[last ? 'right' : 'left'] && tmp[last ? 'right' : 'left'].red) {
              gp[dir2 ? 'right' : 'left'] = RBTree.doubleRotate(p, last);
            } else
            if (tmp[last ? 'left' : 'right'] && tmp[last ? 'left' : 'right'].red) {
              // Hmm... this needs double checking
              gp[dir2 ? 'right' : 'left'] = RBTree.doubleRotate(p, last);
            }

            // ensure correct coloring
            gpc = gp[dir2 ? 'right' : 'left'];
            gpc.red = cur.red = true;
            gpc.left.red = gpc.right.red = false;
          }
        }
      }
    }
  }

  if (found) {
    p[p.right === cur ? 'right' : 'left'] = cur[cur.left ? 'left' : 'right'];
    this.size--;
  }

  this.root = head.right;
  if (this.root) {
    this.root.red = false;
  }

  return !!found;
}

RBTree.prototype.remove = function(node) {
  this.size--;

  if (this.head == node) {
    this.head = node.next;
  }
  if (this.tail == node) {
    this.tail = node.prev;
  }
  if (node.next) {
    node.next.prev = node.prev;
  }
  if (node.prev) {
    node.prev.next = node.next;
  }
  node.next = node.prev = null;

  var parent = node.parent,
      left = node.left,
      right = node.right,
      next;
  if (!left) {
    next = right;
  } else if (!right) {
    next = left;
  } else {
    next = right;
    while (next.left) {
      next = next.left;
    }
  }

  if (parent) {
    if (parent.left === node) {
      parent.left = next;
    } else {
      parent.right = next;
    }
  } else {
    this.root = next;
  }

  // enforce red-black rules
  var isRed;
  if (left && right) {
    isRed = next.red;
    next.red = node.red;
    next.left = left;
    left.parent = next;
    if (next !== right) {
      parent = next.parent;
      next.parent = node.parent;
      node = next.right;
      parent.left = node;
      next.right = right;
      right.parent = next;
    } else {
      next.parent = parent;
      parent = next;
      node = next.right;
    }
  } else {
    isRed = node.red;
    node = next;
  }

  // 'node' is now the sole successor's child and 'parent' its
  // new parent (since the successor can have been moved)
  if (node) {
    node.parent = parent;
  }

  // the 'easy' cases
  if (isRed) {
    return;
  }

  if (node && node.red) {
    node.red = false;
    return;
  }

  // the other cases
  var sibling;
  do {
    if (node === this.root) {
      break;
    }

    if (node === parent.left) {
      sibling = parent.right;
      if (sibling.red) {
        sibling.red = false;
        parent.red = true;
        this.rotateLeft(parent);
        sibling = parent.right;
      }
      if ((sibling.left && sibling.left.red) || (sibling.right && sibling.right.red)) {
        if (!sibling.right || !sibling.right.red) {
          sibling.left.red = false;
          sibling.red = true;
          this.rotateRight(sibling);
          sibling = parent.right;
        }
        sibling.red = parent.red;
        parent.red = sibling.right.red = false;
        this.rotateLeft(parent);
        node = this.root;
        break;
      }
    } else {
      sibling = parent.left;
      if (sibling.red) {
        sibling.red = false;
        parent.red = true;
        this.rotateRight(parent);
        sibling = parent.left;
      }
      if ((sibling.left && sibling.left.red) || (sibling.right && sibling.right.red)) {
        if (!sibling.left || !sibling.left.red) {
          sibling.right.red = false;
          sibling.red = true;
          this.rotateLeft(sibling);
          sibling = parent.left;
        }
        sibling.red = parent.red;
        parent.red = sibling.left.red = false;
        this.rotateRight(parent);
        node = this.root;
        break;
      }
    }
    sibling.red = true;
    node = parent;
    parent = parent.parent;
  } while (!node.red);

  if (node) {
    node.red = false;
  }
}

// removes all nodes from the tree
RBTree.prototype.clear = function() {
  this.root = null;
  this.size = 0;
}

// returns node data if found, null otherwise
RBTree.prototype.find = function(key) {
  var cur = this.root;

  while (cur) {
    if (key == cur.key) {
      return cur;
    } else {
      cur = cur[key > cur.key ? 'right' : 'left'];
    }
  }

  return null;
}

// returns iterator to node if found, null otherwise
RBTree.prototype.findIter = function(key) {
  var cur = this.root;
  var iter = new RBTree.Iterator(this);

  while (cur) {
    if (key == cur.key) {
      iter.node = cur;
      return iter;
    } else {
      iter.ancestors.push(cur);
      res = res[key > cur.key ? 'right' : 'left'];
    }
  }

  return null;
}

// Returns an iterator to the tree node at or immediately after the item
RBTree.prototype.lowerBound = function(key) {
  var cur = this.root;
  var iter = new RBTree.Iterator(this);

  while (cur) {
    if (key == cur.key) {
      iter.node = cur;
      return iter;
    }

    iter.ancestors.push(cur);
    cur = cur[key > cur.key ? 'right' : 'left'];
  }

  for (var i = iter.ancestors.length - 1; i >= 0; --i) {
    cur = iter.ancestors[i];
    if (key < cur.key) {
      iter.node = cur;
      iter.ancestors.length = i;
      return iter;
    }
  }

  iter.ancestors.length = 0;
  return iter;
}

// Returns an iterator to the tree node immediately after the item
RBTree.prototype.upperBound = function(key) {
  var iter = this.lowerBound(key);

  while (iter.node && iter.node.key == key) {
    iter.next();
  }

  return iter;
}

// creates iterator starting from exact node (not key)
RBTree.prototype.iter = function(node) {
  var cur = this.root;
  var iter = new RBTree.Iterator(this);

  while (cur) {
    if (node === cur) {
      iter.node = cur;
      return iter;
    } else {
      iter.ancestors.push(cur);
      res = res[node.key > cur.key ? 'right' : 'left'];
    }
  }

  return null;
};

// calls cb on each node's data, in order
// returns number of nodes iterated
RBTree.prototype.each = RBTree.prototype.forEach = function(cb, thisArg) {
  var iter = new RBTree.Iterator(this), node;
  var index = 0;
  while (node = iter.next()) {
    if (cb.call(arguments.length > 1 ? thisArg : node, node, index++, this) === false) {
      return index;
    }
  }
  return index;
}

// calls cb on each node's data, in reverse order
// returns number of nodes iterated
RBTree.prototype.reach = function(cb, thisArg) {
  var iter = this.iterator(), node;
  var index = this.size - 1;
  while (node = iter.prev()) {
    if (cb.call(arguments.length > 1 ? thisArg : node, node, index--, this) === false) {
      return this.size - index;
    }
  }
  return this.size - index;
}

// Iterator class
RBTree.Iterator = function(tree) {
  this.tree = tree;
  this.ancestors = [];
  this.node = null;
}

// if null-iterator, returns first node
// otherwise, returns next node
RBTree.Iterator.prototype.next = function() {
  if (!this.node) {
    var root = this.tree.root;
    if (root) {
      this._minNode(root);
    }
  } else {
    if (!this.node.right) {
      // no greater node in subtree, go up to parent
      // if coming from a right child, continue up the stack
      var cur;
      do {
        cur = this.node;
        if (this.ancestors.length) {
          this.node = this.ancestors.pop();
        } else {
          this.node = null;
          break;
        }
      } while (this.node.right === cur);
    }
    else {
      // get the next node from the subtree
      this.ancestors.push(this.node);
      this._minNode(this.node.right);
    }
  }
  return this.node;
}

// if null-iterator, returns last node
// otherwise, returns previous node
RBTree.Iterator.prototype.prev = function() {
  if (!this.node) {
    var root = this.tree.root;
    if (root) {
      this._maxNode(root);
    }
  } else {
    if (!this.node.left) {
      var cur;
      do {
        cur = this.node;
        if (this.ancestors.length) {
          this.node = this.ancestors.pop();
        } else {
          this.node = null;
          break;
        }
      } while (this.node.left === cur);
    }
    else {
      this.ancestors.push(this.node);
      this._maxNode(this.node.left);
    }
  }
  return this.node;
}

RBTree.Iterator.prototype.reverse = function() {
  this.reversed = !this.reversed;
  if (this.reversed) {
    this.prev = RBTree.Iterator.prototype.next;
    this.next = RBTree.Iterator.prototype.prev;
  } else {
    delete this.prev;
    delete this.next;
  }
  return this;
}

RBTree.Iterator.prototype._minNode = function(start) {
  while (start.left) {
    this.ancestors.push(start);
    start = start.left;
  }
  this.node = start;
}

RBTree.Iterator.prototype._maxNode = function(start) {
  while (start.right) {
    this.ancestors.push(start);
    start = start.right;
  }
  this.node = start;
}
