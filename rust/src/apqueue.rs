// Adaptive priority queue implementation
// by deNULL
use std::ptr;
use std::fmt;
use std::ops::{Index,IndexMut};
use std::cmp::Ordering;

macro_rules! parent {
	($i:expr) => (($i - 1) >> 1)
}

macro_rules! left {
	($i:expr) => (($i << 1) + 1)
}

macro_rules! right {
	($i:expr) => (($i << 1) + 2)
}

pub struct APNode<T> {
	pub key: f64,
	index: usize,
	pub data: T,
	pub removed: bool
}

pub struct APQueue<T> {
	heap: Vec<APNode<T>>,
	pub size: usize
}

impl<T> APNode<T> {
}

impl<T> PartialOrd for APNode<T> {
    fn partial_cmp(&self, other: &APNode<T>) -> Option<Ordering> {
        self.key.partial_cmp(&other.key)
    }
}

impl<T> Ord for APNode<T> {
    fn cmp(&self, other: &APNode<T>) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

impl<T> PartialEq for APNode<T> {
    fn eq(&self, other: &APNode<T>) -> bool {
        (self.key - other.key).abs() < 1e-10f64
    }
}

impl<T> Eq for APNode<T> {}

impl<T> APQueue<T> {
	pub fn new() -> APQueue<T> {
		APQueue {
			heap: vec![],
			size: 0
		}
	}
	
	fn swap(&mut self, i: usize, j: usize) {
		self.heap.swap(i, j);
		self[i].index = i;
		self[j].index = j;
	}
	
	
	fn upheap(&mut self, index: usize) -> &APNode<T> {
		let mut i = index;
		let mut p;
		while i > 0 {
			p = parent!(i);
			if self[i] > self[p] {
				break
			}
			self.swap(i, p);
			i = p;
		}
		&self[i]
	}
	
	fn downheap(&mut self, index: usize) -> &APNode<T> {
		let mut i = index;
		let mut l = left!(index);
		let mut r;
		let mut bi = index;
		while l < self.size {
			bi = l;
			r = l + 1;
			if (r < self.size) && (self[l] > self[r]) {
				bi = r;
			} 
			if self[bi] >= self[i] {
				return &self[i]
			}
			self.swap(i, bi);
			i = bi;
			l = left!(i);
		}
		&self[bi]
	}
	
	fn bubble(&mut self, index: usize) {
		if (index > 0) && (self[index] < self[parent!(index)]) {
			self.upheap(index);
		} else {
			self.downheap(index);
		}
	}
	
	pub fn peek(&self) -> &APNode<T> {
		&self[0]
	}
	
	pub fn poll(&mut self) -> APNode<T> {
		self.trim();
		self.size -= 1;
		let node = self.heap.swap_remove(0);
		if self.size > 0 {
			self.downheap(0);
		}
		node
	}
	
	pub fn insert(&mut self, key: f64, data: T) -> &APNode<T> {
		let index = self.size;
		let node = APNode {
			key: key,
			index: index,
			data: data,
			removed: false
		};
		if self.size < self.heap.len() {
			self.heap[self.size] = node
		} else {
			self.heap.push(node)
		}
		self.size += 1;
		self.upheap(index)
	}
	
	pub fn remove_at(&mut self, index: usize) -> APNode<T> {
		self.trim();
		self.size -= 1;
		
		let mut node = self.heap.swap_remove(index);
		node.removed = true;
		
		if index < self.size {
			self[index].index = index;
			self.bubble(index);
		}
		
		node
	}
	
	pub fn remove(&mut self, node: &APNode<T>) {
		if !node.removed {
			self.remove_at(node.index);
		}
	}
	
	pub fn is_empty(&self) -> bool {
		self.size == 0
	}
	
	pub fn trim(&mut self) {
		self.heap.truncate(self.size)
	}
}

impl<T> Index<usize> for APQueue<T> {
    type Output = APNode<T>;

    fn index<'a>(&'a self, index: usize) -> &'a APNode<T> {
    	&self.heap[index]
    }
}

impl<T> IndexMut<usize> for APQueue<T> {
    fn index_mut<'a>(&'a mut self, index: usize) -> &'a mut APNode<T> {
        &mut self.heap[index]
    }
}

impl<T> fmt::Display for APQueue<T> {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
		let mut index = 0;
		write!(f, "(APQueue, size = {}, [", self.size);
		while index < self.size {
			if index > 0 {
				write!(f, ", ");
			}
			write!(f, "{}", self[index].key);
			index += 1;
		}
		write!(f, "])")
	}
}