import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import ExampleCarouselImage from "./components/bannerImage.jsx";

function BannerCarousel() {
  const carouselStyle = {
    width: '100%',
    height: '200px', // Small height for the banner
    margin: '0 auto', // Center horizontally
    overflow: 'hidden', // Ensure no overflow
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Ensure the image fills the space proportionally
  };

  return (
    <div style={carouselStyle}>
      <Carousel>
        <Carousel.Item>
          <img
            src="images/banner.webp" // Replace with actual banner image URL
            alt="First slide"
            style={imageStyle}
          />
          <Carousel.Caption>
            <h3>First slide label</h3>
            <p>Nulla vitae elit libero, a pharetra augue mollis interdum.</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            src="images/banner.webp" // Replace with actual banner image URL
            alt="Second slide"
            style={imageStyle}
          />
          <Carousel.Caption>
            <h3>Second slide label</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            src="images/banner.webp" // Replace with actual banner image URL
            alt="Third slide"
            style={imageStyle}
          />
          <Carousel.Caption>
            <h3>Third slide label</h3>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur.</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
    </div>
  );
}

export default BannerCarousel;
