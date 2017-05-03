#[macro_use]
extern crate glium;
extern crate rand;
use rand::*;

mod rbtree; 
mod apqueue;
mod globe;
mod voronoi;
use voronoi::GeoGraph;

use apqueue::APQueue;

fn main() {
	/*use glium::DisplayBuild;
	let display = glium::glutin::WindowBuilder::new().build_glium().unwrap();

	loop {
		// listing the events produced by the window and waiting to be received
		for ev in display.poll_events() {
			match ev {
				glium::glutin::Event::Closed => return,   // the window has been closed by the user
				_ => ()
			}
		}
	}*/

	let seed: &[_] = &[1, 2, 3, 4];
	let mut rng: StdRng = SeedableRng::from_seed(seed);
	let mut globe = globe::Globe::new(&mut rng, 100.0f64, 10);
	println!("Here's globe: {}", globe);
	
	
	let tree: rbtree::RBTree<i32> = rbtree::RBTree::new();
	println!("Created a tree: {}", tree.size);
	//tree.insert(after, node)
	
	let mut q: APQueue<u32> = APQueue::new();
	q.insert(3.0f64, 3);
	q.insert(2.0f64, 2);
	q.insert(1.0f64, 1);
	println!("{}", q);
	println!("pulled: {}", q.poll().key);
	println!("{}", q);
}