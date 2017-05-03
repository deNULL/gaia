// Red-black tree implementation
// by deNULL
use std::ptr;

macro_rules! red {
	($node:expr) => (!$node.is_null() && (*$node).red)
}

#[allow(dead_code)]
pub struct RBNode<'a, T:'a> {
	red: bool,
	parent: *mut RBNode<'a, T>,
	pub left: *mut RBNode<'a, T>,
	pub right: *mut RBNode<'a, T>,
	pub prev: *mut RBNode<'a, T>,
	pub next: *mut RBNode<'a, T>,
	pub data: T
}

#[allow(dead_code)]
pub struct RBTree<'a, T:'a> {
	pub root: *mut RBNode<'a, T>,
	pub head: *mut RBNode<'a, T>,
	pub tail: *mut RBNode<'a, T>,
	pub heap: Vec<&'a mut RBNode<'a, T>>,
	pub size: u32
}

#[allow(dead_code)]
impl<'a, T:'a> RBNode<'a, T> {
	pub fn new(data: T) -> RBNode<'a, T> {
		RBNode {
			red: true,
			parent: ptr::null_mut(),
			left: ptr::null_mut(),
			right: ptr::null_mut(),
			prev: ptr::null_mut(),
			next: ptr::null_mut(),
			data: data
		}
	}
}

impl<'a, T:'a> RBTree<'a, T> {
	pub fn new() -> RBTree<'a, T> {
		RBTree {
			root: ptr::null_mut(),
			head: ptr::null_mut(),
			tail: ptr::null_mut(),
			heap: vec![],
			size: 0
		}
	}
	
	unsafe fn rotate_left(&mut self, node: *mut RBNode<'a, T>) {
		let mut p = node;
		let mut q = (*node).right;
		let mut parent = (*node).parent;
		
		if parent.is_null() {
			self.root = q;
		} else {
			if (*parent).left == p {
				(*parent).left = q;
			} else {
				(*parent).right = q;
			}
		}
		
		(*q).parent = parent;
		(*p).parent = q;
		(*p).right = (*q).left;
		if !(*p).right.is_null() {
			(*(*p).right).parent = p;
		}
		(*q).left = p;
	}
	
	unsafe fn rotate_right(&mut self, node: *mut RBNode<'a, T>) {
		let mut p = node;
		let mut q = (*node).left;
		let mut parent = (*node).parent;
		
		if parent.is_null() {
			self.root = q;
		} else {
			if (*parent).left == p {
				(*parent).left = q;
			} else {
				(*parent).right = q;
			}
		}
		
		(*q).parent = parent;
		(*p).parent = q;
		(*p).left = (*q).right;
		if !(*p).left.is_null() {
			(*(*p).left).parent = p;
		}
		(*q).right = p;
	}
	
	#[allow(dead_code)]
	pub fn insert(&mut self, after: *mut RBNode<'a, T>, data: T) -> RBNode<'a, T> {
		unsafe {
			let mut base = after;
			
			let mut node: RBNode<'a, T> = RBNode::new(data);
			
			self.size += 1;
			
			if !base.is_null() {
				node.prev = base;
				node.next = (*base).next;
				
				if !(*base).next.is_null() {
					(*(*base).next).prev = &mut node;
				}
				
				(*base).next = &mut node;
				
				if self.tail == base {
					self.tail = &mut node;
				}
				
				if (*base).right.is_null() {
					(*base).right = &mut node;
				} else {
					base = (*base).right;
					while !(*base).left.is_null() {
						base = (*base).left;
					}
					(*base).left = &mut node;
				}
				
				node.parent = base;
			} else
			if !self.root.is_null() {
				base = self.head;
				node.prev = ptr::null_mut();
				node.next = base;
				self.head = &mut node;
				(*base).prev = &mut node;
				(*base).left = &mut node;
				
				node.parent = base;
			} else {
				node.prev = ptr::null_mut();
				node.next = ptr::null_mut();
				self.root = &mut node;
				self.head = &mut node;
				self.tail = &mut node;
				
				node.parent = ptr::null_mut();
			}
			
			// Fixup the modified tree by recoloring nodes and performing
			// rotations (2 at most) hence the red-black tree properties are
			// preserved
			
			let mut n: *mut RBNode<'a, T> = &mut node;
			let mut p = node.parent;
			let mut gp: *mut RBNode<'a, T>;
			
			while red!(p) {
				gp = (*p).parent;
				if p == (*gp).left {
					if red!((*gp).right) {
						(*p).red = false;
						(*gp).red = true;
						(*(*gp).right).red = false;
						n = gp;
					} else {
						if n == (*p).right {
							self.rotate_left(p);
							n = p;
							p = (*n).parent;
						}
						(*p).red = false;
						(*gp).red = true;
						self.rotate_right(gp);
					}
				} else {
					if red!((*gp).left) {
						(*p).red = false;
						(*gp).red = true;
						(*(*gp).left).red = false;
						n = gp;
					} else {
						if n == (*p).left {
							self.rotate_right(p);
							n = p;
							p = (*n).parent;
						}
						(*p).red = false;
						(*gp).red = true;
						self.rotate_left(gp);
					}
				}
				p = (*n).parent;
			}
			(*self.root).red = false;
			println!("{}", self.root as u32);
			println!("{}", (*self.root).parent as u32);
			
			node
		}
	}
	
	#[allow(dead_code)]
	pub fn remove(&mut self, node: *mut RBNode<'a, T>) {
		unsafe {
			self.size -= 1;
			
			if self.head == node {
				self.head = (*node).next;
			}
			if self.tail == node {
				self.tail = (*node).prev;
			}
			if !(*node).next.is_null() {
				(*(*node).next).prev = (*node).prev;
			}
			if !(*node).prev.is_null() {
				(*(*node).prev).next = (*node).next;
			}
			(*node).next = ptr::null_mut();
			(*node).prev = ptr::null_mut();
			
			let mut parent = (*node).parent;
			let mut left = (*node).left;
			let mut right = (*node).right;
			let mut cur;
			let mut next: *mut RBNode<'a, T>;
			let mut sibling: *mut RBNode<'a, T>;
			if left.is_null() {
				next = right;
			} else
			if right.is_null() {
				next = left;
			} else {
				next = right;
				while !(*next).left.is_null() {
					next = (*next).left;
				}
			}
			
			if parent.is_null() {
				self.root = next;
			} else {
				if (*parent).left == node {
					(*parent).left = next;
				} else {
					(*parent).right = next;
				}
			}
			
			// enforce red-black rules
			let is_red: bool;
			if left.is_null() || right.is_null() {
				is_red = (*node).red;
				cur = next;
			} else {
				is_red = (*next).red;
				(*next).red = (*node).red;
				(*next).left = left;
				(*left).parent = next;
				if next != right {
					parent = (*next).parent;
					(*next).parent = (*node).parent;
					cur = (*next).right;
					(*parent).left = cur;
					(*next).right = right;
					(*right).parent = next;
				} else {
					(*next).parent = parent;
					parent = next;
					cur = (*next).right;
				}
			}
			
			if !cur.is_null() {
				(*cur).parent = parent;
			}
			
			if is_red {
				return
			}
			
			if !cur.is_null() && (*cur).red {
				(*cur).red = false;
				return
			}
			
			while cur != self.root {
				if cur == (*parent).left {
					sibling = (*parent).right;
					if (*sibling).red {
						(*sibling).red = false;
						(*parent).red = true;
						self.rotate_left(parent);
						sibling = (*parent).right;
					}
					if red!((*sibling).left) || red!((*sibling).right) {
						if red!((*sibling).left) {
							(*(*sibling).left).red = false;
							(*sibling).red = true;
							self.rotate_right(sibling);
							sibling = (*parent).right;
						}
						(*sibling).red = (*parent).red;
						(*parent).red = false;
						(*(*sibling).right).red = false;
						self.rotate_left(parent);
						cur = self.root;
						break
					}
				} else {
					sibling = (*parent).left;
					if (*sibling).red {
						(*sibling).red = false;
						(*parent).red = true;
						self.rotate_right(parent);
						sibling = (*parent).left;
					}
					if red!((*sibling).left) || red!((*sibling).right) {
						if red!((*sibling).right) {
							(*(*sibling).right).red = false;
							(*sibling).red = true;
							self.rotate_left(sibling);
							sibling = (*parent).left;
						}
						(*sibling).red = (*parent).red;
						(*parent).red = false;
						(*(*sibling).left).red = false;
						self.rotate_right(parent);
						cur = self.root;
						break
					}
				}
				
				(*sibling).red = true;
				cur = parent;
				parent = (*cur).parent;
				
				if (*cur).red {
					break
				}
			}
			
			if !cur.is_null() {
				(*cur).red = false;
			}
		}
	}
}