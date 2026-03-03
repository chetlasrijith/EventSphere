// src/components/EventCarousel.jsx
import React, { useState,useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import axios from 'axios';

const EventCarousel = () => {
  const [banners,setBanners] =useState([]);
  const fetchBanners =async ()=>{
    try{
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER}/api/home/banners`,{
        withCredentials:true,
      });
      if(response.status === 200){
        setBanners(response.data);
      }
    }catch(err){
      console.log(err);
    }
  }
  useEffect(()=>{
    fetchBanners();
  },[]);
  return (
    <div className="w-full flex justify-center py-8 bg-gray-100">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        loop={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false, // Autoplay continues after interaction
        }}
        coverflowEffect={{
          rotate: 0, // No rotation
          stretch: 0, // No stretching
          depth: 50, // Reduced depth to minimize overlap
          modifier: 1, // Adjust spacing between slides
          slideShadows: true, // Optional: Enable shadows for a 3D effect
        }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination, Autoplay]}
        className="w-full max-w-[800px] h-[400px]"
      >
        {Array.isArray(banners)&&banners.map((event) => (
            <SwiperSlide
  key={event.id}
  className="relative bg-white rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
  style={{ width: '40%', height: '350px' }} 
>
  <img
    src={event.image}
    alt={event.title}
    className="w-100 h-100 object-cover object-center rounded-2xl" 
  />
  <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-black bg-opacity-50 text-white rounded-b-2xl">
    <h3 className="text-2xl font-bold">{event.title}</h3>
    <p>{event.date}</p>
    <p>{event.location}</p>
    <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
      Book Now
    </button>
  </div>
</SwiperSlide>

        ))}
      </Swiper>
    </div>
  );
};

export default EventCarousel;