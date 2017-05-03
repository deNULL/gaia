'use strict';
/*
  Based on FastPriorityQueue (https://github.com/lemire/FastPriorityQueue.js)
  with adaptiveness (removing arbitrary items) from
  https://github.com/fletchto99/CSI2110/blob/master/Labs/resources/net/datastructures/HeapAdaptablePriorityQueue.java

  Also no comparators here: you need to specify key when adding an item, and it will be stored within it.
  This probably makes this implementation even faster.
*/

function PriorityQueue() {
  this.heap = [];
  this.size = 0;
}

// for internal use
// = upheap
PriorityQueue.prototype._percolateUp = function(i) {
  var p;
  while (i > 0) {
    p = (i - 1) >> 1;
    if (this.heap[i].key >= this.heap[p].key) {
      break;
    }
    this.swap(i, p);
    i = p;
  }
}

// for internal use
// = downheap
PriorityQueue.prototype._percolateDown = function(i) {
  var l = (i << 1) + 1;
  var r;
  var bi;
  while (l < this.size) {
    bi = l;
    r = l + 1;
    if ((r < this.size) && (this.heap[l].key > this.heap[r].key)) {
      bi = r;
    }
    if (this.heap[bi].key >= this.heap[i].key) {
      break;
    }
    this.swap(i, bi);
    i = bi;
    l = (i << 1) + 1;
  }
}


PriorityQueue.prototype._bubble = function(i) {
  if ((i > 0) && (this.heap[i].key < this.heap[(i - 1) >> 1].key)) {
    this._percolateUp(i);
  } else {
    this._percolateDown(i);
  }
}

// Add an element the the queue
// runs in O(log n) time
// = insert
PriorityQueue.prototype.insert = PriorityQueue.prototype.add = function(node) {
  // node should contain key
  node.index = this.size;

  this.heap[this.size] = node;
  this.size++;
  this._percolateUp(this.size - 1);
}

PriorityQueue.prototype.remove = function(node) {
  this.removeAt(node.index);
}

PriorityQueue.prototype.get = function(index) {
  return this.heap[index];
}

PriorityQueue.prototype.removeAt = function(index) {
  this.size--;
  if (index == this.size) {
    return this.heap[index];
  } else {
    var node = this.heap[index];
    this.heap[index] = this.heap[this.size];
    this.heap[index].index = index;
    this._bubble(index);
    return node;
  }
}

PriorityQueue.prototype.replaceKey = function(node, key) {
  node.key = key;
  this._bubble(node.index);
}

// replace the content of the heap by provided array and "heapifies it"
PriorityQueue.prototype.heapify = function(array) {
  this.heap = array;
  this.size = array.length;

  for (var i = (this.size >> 1); i >= 0; i--) {
    this._percolateDown(i);
  }
}

PriorityQueue.prototype.swap = function(i, j) {
  var node = this.heap[i];
  this.heap[i] = this.heap[j];
  this.heap[i].index = i;
  this.heap[j] = node;
  this.heap[j].index = j;
}

// Look at the top of the queue (a smallest element)
// executes in constant time
//
// Calling peek on an empty priority queue returns
// the "undefined" value.
//
// = min
PriorityQueue.prototype.peek = function () {
  if (!this.size) {
    return undefined;
  }
  return this.heap[0];
};

// remove the element on top of the heap (a smallest element)
// runs in logarithmic time
//
// If the priority queue is empty, the function returns the
// "undefined" value.
//
// For long-running and large priority queues, or priority queues
// storing large objects, you may  want to call the trim function
// at strategic times to recover allocated memory.
// = removeMin
PriorityQueue.prototype.poll = function () {
  if (!this.size) {
    return undefined;
  }
  var ans = this.heap[0];
  this.size--;
  if (this.size) {
    this.heap[0] = this.heap[this.size];
    this._percolateDown(0);
  }
  return ans;
};


// recover unused memory (for long-running priority queues)
PriorityQueue.prototype.trim = function () {
  this.heap = this.heap.slice(0, this.size);
};

// Check whether the heap is empty
PriorityQueue.prototype.isEmpty = function () {
  return this.size === 0;
};
