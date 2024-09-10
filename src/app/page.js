// pages/index.js
import Navbar from '@/components/Header';
import ZoomableCirclePacking from  '../components/ZoomableCirclePacking'
export default function Home() {
  return (
    <div>
      <Navbar/>
      <ZoomableCirclePacking />
    </div>
  );
}
