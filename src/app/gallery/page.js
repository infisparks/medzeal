'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header/Header'
import Image from 'next/image' // Optional: For optimized images if using Next.js

const sampleAssets = [
  { id: '1', type: 'image', path: '/area/1.jpeg', title: 'Reception' },
  { id: '2', type: 'image', path: '/area/2.jpeg', title: 'Exercise area' },
  { id: '3', type: 'image', path: '/area/3.jpeg', title: 'Counselling room' },
  { id: '4', type: 'image', path: '/area/4.jpeg', title: 'Counselling room' },
  { id: '5', type: 'image', path: '/area/5.jpeg', title: 'Orchid room' },
  { id: '6', type: 'image', path: '/area/6.jpeg', title: 'Tulip room' },
  { id: '7', type: 'image', path: '/area/7.jpeg', title: 'Orchid room' },
  { id: '8', type: 'image', path: '/area/8.jpeg', title: 'tulip room' },
  { id: '9', type: 'image', path: '/area/9.jpeg', title: 'Clinic Entrance' },
  { id: '10', type: 'image', path: '/area/10.jpeg', title: 'Exercise area' },
  { id: '11', type: 'image', path: '/area/11.jpeg', title: 'Tulip room' },
  { id: '12', type: 'image', path: '/area/12.jpeg', title: 'Exercise area' },
  { id: '13', type: 'image', path: '/area/13.jpeg', title: 'Exercise area' },
  { id: '14', type: 'image', path: '/area/14.jpeg', title: 'Reception area' },
  { id: '15', type: 'image', path: '/area/15.jpeg', title: 'Exercise area' },
  { id: '16', type: 'image', path: '/area/16.jpeg', title: 'Waiting area' },
  { id: '17', type: 'image', path: '/area/17.jpeg', title: 'Clinic overview' },
  { 
    id: '18', 
    type: 'video', 
    path: '/area/vedio.mp4', 
    title: 'Medical Equipment',
    thumbnail: '/area/2.jpeg' // Thumbnail for video
  },
]

export default function HospitalGallery() {
  const [selectedAsset, setSelectedAsset] = useState(null)

  // Optional: Handle Esc key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedAsset) {
        setSelectedAsset(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAsset])

  const handleBack = () => setSelectedAsset(null)

  return (
    <>
      <Header />
      <div className="container my-4">
  

        {/* Gallery View */}
        {!selectedAsset && (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {sampleAssets.map((asset) => (
              <div className="col" key={asset.id}>
                <div
                  className="card h-100 shadow-sm"
                  onClick={() => setSelectedAsset(asset)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ratio ratio-1x1">
                    {asset.type === 'image' ? (
                      <img
                        src={asset.path}
                        alt={asset.title}
                        className="card-img-top object-fit-cover"
                      />
                    ) : (
                      <img
                        src={asset.thumbnail}
                        alt={`${asset.title} Thumbnail`}
                        className="card-img-top object-fit-cover"
                      />
                    )}
                  </div>
                  <div className="card-body">
                    <h5 className="card-title text-primary">{asset.title}</h5>
                    <p className="card-text text-muted">
                      {asset.type === 'image' ? 'Image' : 'Video'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen View */}
        {selectedAsset && (
          <div className="fullscreen-view">
            <button className="btn btn-secondary mb-3" onClick={handleBack}>
              &larr; Back to Gallery
            </button>
            <div className="media-container">
              {selectedAsset.type === 'image' ? (
                <img
                  src={selectedAsset.path}
                  alt={selectedAsset.title}
                  className="img-fluid"
                />
              ) : (
                <video src={selectedAsset.path} controls className="w-100">
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        /* Fullscreen View Styles */
        .fullscreen-view {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1050; /* Higher than Bootstrap's modal */
          padding: 20px;
          box-sizing: border-box;
        }
        .fullscreen-view .media-container {
          max-width: 90%;
          max-height: 90%;
        }
        .fullscreen-view img,
        .fullscreen-view video {
          max-width: 100%;
          max-height: 100%;
          border-radius: 8px;
        }
        .btn-secondary {
          position: absolute;
          top: 20px;
          left: 20px;
        }

        /* Optional: Transition for smoothness */
        .fullscreen-view {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Responsive Adjustments */
        @media (max-width: 576px) {
          .btn-secondary {
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            font-size: 14px;
          }
        }
      `}</style>
    </>
  )
}
