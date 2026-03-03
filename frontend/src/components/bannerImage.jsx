import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

const ExampleCarouselImage = () => {
  return (
    <div>
      <img
        className="d-block w-100"
        src="images/banner.webp"
        alt="Banner image"
      />
      <Carousel.Caption>
        <h3>Banner </h3>
        <p>Example caption text here.</p>
      </Carousel.Caption>
    </div>
  );
};

export default ExampleCarouselImage;
