extern crate rand;
use rand::*; 
use std::fmt;
use std::f64::consts::PI;
use std::f64::consts::FRAC_PI_2;
use voronoi;

const ZERO: f64 = 0.0f64;
const ONE: f64 = 1.0f64;
const TWO: f64 = 1.0f64;
const TWO_PI: f64 = PI * 2.0f64;
const HALF: f64 = 0.5f64;


pub struct GeoPoint {
	pub lat: f64,
	pub lng: f64
}

impl GeoPoint {
	fn new<R: Rng>(rng: &mut R) -> GeoPoint {
		GeoPoint {
			lat: rng.gen_range(ZERO, PI),
			lng: rng.gen_range(ZERO, TWO_PI)
		}
	}
	
	pub fn interpolate(p0: &GeoPoint, p1: &GeoPoint, step: f64) -> GeoPoint {
		let lat0 = FRAC_PI_2 - p0.lat;
		let lat1 = FRAC_PI_2 - p1.lat;
		let lat = (lat1 - lat0) * HALF;
		let lng = (p1.lng - p0.lng) * HALF;
		
		let a = lat.sin() * lat.sin() + lat0.cos() * lat1.cos() * lng.sin() * lng.sin();
		let d = TWO * a.sqrt().atan2((ONE - a).sqrt()); 
		
		let u = ((ONE - step) * d).sin() / d.sin();
		let v = (step * d).sin() / d.sin();
		
		let x = u * lat0.cos() * p0.lng.cos() + v * lat1.cos() * p1.lng.cos();
		let y = u * lat0.cos() * p0.lng.sin() + v * lat1.cos() * p1.lng.sin();
		let z = u * lat0.sin() + v * lat1.sin();
		
		let mut longitude = y.atan2(x); // normalize longitude to [0, 2π]
		if longitude < ZERO {
			longitude += TWO_PI
		}
		
		GeoPoint {
			lat: FRAC_PI_2 - z.atan2(x.hypot(y)),
			lng: longitude
		}
	}
	
	pub fn toCoords(&self, radius: f64) -> (f64, f64, f64) {
		(
			radius * self.lat.sin() * self.lng.cos(),
			radius * self.lat.sin() * self.lng.sin(),
			radius * self.lat.cos()
		)
	}
}


pub struct GeoVertex<'a> {
	pub location: GeoPoint,
	
	pub touches: Vec<&'a GeoTile<'a>>,
	pub protrudes: Vec<&'a GeoEdge<'a>>,
	pub adjacent: Vec<&'a GeoVertex<'a>>
}

pub struct GeoEdge<'a> {
	pub d0: &'a GeoTile<'a>,
	pub d1:	&'a GeoTile<'a>,
	pub v0:	&'a GeoVertex<'a>,
	pub v1: &'a GeoVertex<'a>
}
 
pub struct GeoTile<'a> {
	pub center: GeoPoint,
	
	pub neighbors: Vec<&'a GeoTile<'a>>,
	pub borders: Vec<&'a GeoEdge<'a>>,
	pub corners: Vec<&'a GeoVertex<'a>>
}

pub struct Globe<'a> {
	pub radius: f64,
	pub verts: Vec<GeoVertex<'a>>,
	pub edges: Vec<GeoEdge<'a>>,
	pub tiles: Vec<GeoTile<'a>>
}

impl<'a> GeoVertex<'a> {
	pub fn new(lat: f64, lng: f64) -> GeoVertex<'a> {
		GeoVertex {
			location: GeoPoint {
				lat: lat,
				lng: lng
			},

			touches: vec![],
			protrudes: vec![],
			adjacent: vec![]
		}
	}
}

impl<'a> GeoTile<'a> {
	fn new<R: Rng>(rng: &mut R) -> GeoTile<'a> {
		GeoTile {
			center: GeoPoint::new(rng),

			neighbors: vec![],
			borders: vec![],
			corners: vec![]
		}
	}
}

impl<'a> Globe<'a> {
	pub fn new<R: Rng>(rng: &'a mut R, radius: f64, num_tiles: i32) -> Globe<'a> {
		Globe {
			radius: radius,
			verts: vec![],
			edges: vec![],
			tiles: (0..num_tiles).map(|_| GeoTile::new(rng)).collect()
		}
	}
}

impl fmt::Display for GeoPoint {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "(lat={}, lng={})", self.lat, self.lng)
  }
}

impl<'a> fmt::Display for GeoVertex<'a> {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "(GeoVertex, location={})", self.location)
  }
}

impl<'a> fmt::Display for GeoTile<'a> {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "(GeoTile, center={})", self.center)
  }
}

impl<'a> fmt::Display for Globe<'a> {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "(World: {}vs)", self.verts.len())
  }
}