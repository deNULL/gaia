use rbtree::RBTree;
use rbtree::RBNode;
use std::ptr;
use apqueue::APQueue;
use apqueue::APNode;
use globe; 

use std::f64::consts::PI;
use std::f64::consts::FRAC_PI_2;

const ZERO: f64 = 0.0f64;
const ONE: f64 = 1.0f64;
const TWO: f64 = 1.0f64;
const TWO_PI: f64 = PI * 2.0f64;
const HALF: f64 = 0.5f64;

pub struct Arc<'a> {
	tile: &'a globe::GeoTile<'a>,
	roll: Option<&'a APNode<VoronoiEvent<'a>>>,
	circle: Option<&'a APNode<VoronoiEvent<'a>>>
}

enum VoronoiEvent<'a> {
	Site {
		tile: &'a globe::GeoTile<'a>,
		location: &'a globe::GeoPoint
	},
	Circle {
		arc: *mut RBNode<'a, Arc<'a>>,
		center: (f64, f64, f64)
	},
	RollRight {
		arc: *mut RBNode<'a, Arc<'a>>
	},
	RollLeft {
		arc: *mut RBNode<'a, Arc<'a>>
	}
}

pub trait GeoGraph {
	fn voronoi(&mut self) { }
}



fn check_roll_events() {
	
}

unsafe fn check_circle_event<'a>(queue: &mut APQueue<VoronoiEvent<'a>>, a: *mut RBNode<'a, Arc<'a>>, b: *mut RBNode<'a, Arc<'a>>, c: *mut RBNode<'a, Arc<'a>>, r: f64) {
	if (*b).data.circle.is_some() {
		queue.remove((*b).data.circle.unwrap());
	}
	
	let A = (*a).data.tile.center.toCoords(1.0f64);
	let B = (*b).data.tile.center.toCoords(1.0f64);
	let C = (*c).data.tile.center.toCoords(1.0f64);
	let vx = (A.1 - B.1) * (C.2 - B.2) - (A.2 - B.2) * (C.1 - B.1);
	let vy = (A.2 - B.2) * (C.0 - B.0) - (A.0 - B.0) * (C.2 - B.2);
	let vz = (A.0 - B.0) * (C.1 - B.1) - (A.1 - B.1) * (C.0 - B.0);
	
	let len2 = vx * vx + vy * vy + vz * vz;
	let len = len2.sqrt();
	
	let lat = (vz / len).acos() + (A.0 * vx / len + A.1 * vy / len + A.2 * vz / len).acos();
	
	if lat > r {
		let circle = VoronoiEvent::Circle {
			arc: b,
			center: (vx, vy, vz)
		};
		(*b).data.circle = Some(queue.insert(lat, circle));
	}
}

unsafe fn insert_beach_arc<'a>(globe: &globe::Globe, beach: &mut RBTree<'a, Arc<'a>>, above: *mut RBNode<'a, Arc<'a>>, arc: Arc<'a>) {
	let mut dup = Arc::new((*above).data.tile);
	
	
}

// Append a half edge to the graph
fn half_edge<'a>(globe: &globe::Globe, d0: &globe::GeoTile<'a>, d1: &globe::GeoTile<'a>, v: &globe::GeoVertex) {
	
}

unsafe fn delete_roll_events<'a>(queue: &mut APQueue<VoronoiEvent<'a>>, beach: &mut RBTree<'a, Arc<'a>>) {
	if !beach.head.is_null() && (*beach.head).data.roll.is_some() {
		let roll = (*beach.head).data.roll.unwrap();
		queue.remove(roll);
		(*beach.head).data.roll = None;
	}
}

unsafe fn delete_circle_events<'a>(queue: &mut APQueue<VoronoiEvent<'a>>, node: *mut RBNode<'a, Arc<'a>>) {
	if (*node).data.circle.is_some() {
		let circle = (*node).data.circle.unwrap();
		queue.remove(circle);
		(*node).data.circle = None;
	}
}

unsafe fn validate_head_tail<'a>(beach: &mut RBTree<'a, Arc<'a>>, r: f64) {
	if !beach.tail.is_null() && !(*beach.tail).prev.is_null() {
		let pos1 = intersect(&(*(*beach.tail).prev).data.tile.center, &(*beach.tail).data.tile.center, r);
		let pos2 = intersect(&(*beach.tail).data.tile.center, &(*beach.head).data.tile.center, r);
		
		if pos2.lng < pos1.lng {
			let tail = beach.tail;
			beach.remove(tail);
			
			let mut arc = Arc::new((*tail).data.tile);
			arc.circle = (*tail).data.circle;
			arc.roll = (*tail).data.roll;
			beach.insert(ptr::null_mut(), arc);
		} else {
			let pos3 = intersect(&(*beach.head).data.tile.center, &(*(*beach.head).next).data.tile.center, r);
			if pos2.lng < pos3.lng {
				let head = beach.head;
				let tail = beach.tail;
				beach.remove(head);
				
				let mut arc = Arc::new((*head).data.tile);
				arc.circle = (*head).data.circle;
				arc.roll = (*head).data.roll;
				beach.insert(tail, arc);
			}
		}
	}
}

// Find an intersection found when iterating from v0 ellipse to v1 ellipse at the sweep line radius r 
fn intersect(v0: &globe::GeoPoint, v1: &globe::GeoPoint, r: f64) -> globe::GeoPoint {
	let c0 = (r.cos() - v1.lat.cos()) * v0.lat.sin();
	let c1 = (r.cos() - v0.lat.cos()) * v1.lat.sin();
	let a = c0 * v0.lng.cos() - c1 * v1.lng.cos();
	let b = c0 * v0.lng.sin() - c1 * v1.lng.sin();
	
	let gamma = a.atan2(b);
	let dt = (v0.lat.cos() - v1.lat.cos()) * r.sin();
	
	let mut lng = (dt / a.hypot(b)) - gamma;
	if lng < ZERO {
		lng += TWO_PI;
	} else
	if lng > TWO_PI {
		lng -= TWO_PI;
	}
	
	let lat = (v0.lat.cos() - r.cos()).atan2(r.sin() - v0.lat.sin() * (v0.lng - lng).cos());
	
	globe::GeoPoint {
		lat: lat,
		lng: lng
	} 
}

impl<'a> Arc<'a> {
	fn new(tile: &'a globe::GeoTile<'a>) -> Arc<'a> {
		Arc {
			tile: tile,
			roll: None,
			circle: None
		}
	}
}

impl<'a> GeoGraph for globe::Globe<'a> {
	fn voronoi<'b>(&mut self) {
		let mut queue: APQueue<VoronoiEvent> = APQueue::new();
		for tile in &self.tiles {
			println!("adding a tile");
			let event = VoronoiEvent::Site { tile: tile, location: &tile.center };
			queue.insert(tile.center.lat, event);
		}
		
		let mut beach: RBTree<Arc> = RBTree::new();
		while !queue.is_empty() {
			unsafe {
				let event = queue.poll();
				let sweep = event.key;
				//println!("sweeping at {}", sweep);
				
				validate_head_tail(&mut beach, sweep);
				match event.data {
					VoronoiEvent::Site { tile, location } => {
						let arc = Arc::new(&tile);
						if beach.size == 0 {
							beach.insert(ptr::null_mut(), arc);
						} else
						if beach.size == 1 {
							let cur = beach.root;
							beach.insert(cur, arc);
							check_roll_events();
						} else {
							let mut dir = false;
							let mut cur = beach.root;
						
							while !cur.is_null() {
								let prev;
								if (*cur).prev.is_null() {
									prev = beach.tail;
								} else {
									prev = (*cur).prev;
								}
								let next;
								if (*cur).next.is_null() {
									next = beach.head;
								} else {
									next = (*cur).next;
								}
								
								let prev_int = intersect(&(*prev).data.tile.center, &(*cur).data.tile.center, sweep);
								let next_int = intersect(&(*cur).data.tile.center, &(*next).data.tile.center, sweep);
								if next_int.lng > prev_int.lng { // prime meridian is not within arc
									if location.lng > next_int.lng { // move forward
										if (*cur).right.is_null() { // no more right children, inserting here
											insert_beach_arc(self, &mut beach, next, arc);
											break;
										} else { // moving further down (and forward)
											cur = (*cur).right;
											dir = true;
										}
									} else
									if location.lng < prev_int.lng { // move backward
										if (*cur).left.is_null() { // no more left children, inserting here
											insert_beach_arc(self, &mut beach, prev, arc);
											break;
										} else { // moving further down (and backward)
											cur = (*cur).left;
											dir = false;
										}
									} else { // new site is within current arc
										insert_beach_arc(self, &mut beach, cur, arc);
										break;
									}
								} else { // arc is over the prime meridian (this should always be a first arc in beach line)
									if (location.lng > prev_int.lng) || (location.lng < next_int.lng) {
										insert_beach_arc(self, &mut beach, cur, arc);
										break;
									} else {
										if dir { // we were moving right, reverse
											if (*cur).left.is_null() {
												insert_beach_arc(self, &mut beach, prev, arc);
												break;
											} else {
												dir = false;
												cur = (*cur).left;
											}
										} else { // we were moving left, reverse
											if (*cur).right.is_null() {
												insert_beach_arc(self, &mut beach, next, arc);
												break;
											} else {
												dir = true;
												cur = (*cur).right;
											}
										}
									}
								}
							}
						}
					},
					VoronoiEvent::Circle { arc, center } => {
						let a;
						if (*arc).prev.is_null() {
							a = beach.tail;
						} else {
							a = (*arc).prev;
						}
						let b: *mut RBNode<Arc> = arc;
						let c;
						if (*arc).prev.is_null() {
							c = beach.tail;
						} else {
							c = (*arc).prev;
						}
						
						let len = (center.0 * center.0 + center.1 * center.1 + center.2 * center.2).sqrt();
						let mut lng = center.1.atan2(center.0);
						if lng < ZERO {
							lng += TWO_PI;
						}
						
						let vert = globe::GeoVertex::new((center.2 / len).acos(), lng);
					
						half_edge(self, (*a).data.tile, (*b).data.tile, &vert);
						half_edge(self, (*b).data.tile, (*c).data.tile, &vert);
						half_edge(self, (*a).data.tile, (*c).data.tile, &vert);
					
						delete_roll_events(&mut queue, &mut beach);
						delete_circle_events(&mut queue, b);
						
						beach.remove(b);
						
						if (*a).prev.is_null() {
							check_circle_event(&mut queue, beach.tail, a, c, sweep);
						} else {
							check_circle_event(&mut queue, (*a).prev, a, c, sweep);
						}
						if (*c).next.is_null() {
							check_circle_event(&mut queue, a, c, beach.head, sweep);
						} else {
							check_circle_event(&mut queue, a, c, (*c).next, sweep);
						}
						
						validate_head_tail(&mut beach, sweep);
						
						check_roll_events();
						
						self.verts.push(vert);
					},
					VoronoiEvent::RollRight { .. } => {
						let pos;
						if (*beach.head).next.is_null() {
							pos = intersect(&(*beach.head).data.tile.center, &(*beach.tail).data.tile.center, sweep)
						} else {
							pos = intersect(&(*beach.head).data.tile.center, &(*(*beach.head).next).data.tile.center, sweep)
						}
						
						// validate roll event
						if pos.lng.abs() < 1e-7f64 || (pos.lng - TWO_PI).abs() < 1e-7f64 {
							let head = beach.head;
							let tail = beach.tail;
							beach.remove(head);
							
							let mut arc = Arc::new((*head).data.tile);
							arc.circle = (*head).data.circle;
							arc.roll = (*head).data.roll;
							beach.insert(tail, arc);
							
							check_roll_events();
						}
					},
					VoronoiEvent::RollLeft { .. } => {
						let pos = intersect(&(*beach.tail).data.tile.center, &(*beach.head).data.tile.center, sweep);
						
						// validate roll event
						if pos.lng.abs() < 1e-7f64 || (pos.lng - TWO_PI).abs() < 1e-7f64 {
							let tail = beach.tail;
							beach.remove(tail);
							
							let mut arc = Arc::new((*tail).data.tile);
							arc.circle = (*tail).data.circle;
							arc.roll = (*tail).data.roll;
							beach.insert(ptr::null_mut(), arc);
							
							check_roll_events();
						}
					}
				}
			}
		}
	}
}