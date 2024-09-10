"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import wesee from '../public/wesee-logo.png'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-lg rounded-md">
        <Image 
          src={wesee}
          className=" "
          width={100}
          height={100}
          alt="logo"
        />
        <span className="ml-4 text-5xl underline font-bold text-blue-500">VENDOR REPOSITORY</span>
      <div className="flex gap-4">
       
      </div>
    </nav>
  );
}
