"use client"

import React, { useRef, useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import confetti from 'canvas-confetti'
// import 'bootstrap/dist/css/bootstrap.min.css'

const SCRATCH_PERCENTAGE = 50

export default function ScratchCardPage() {
  const canvasRef = useRef(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const controls = useAnimation()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Function to generate a random coupon code
    const generateCouponCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      return Array.from({ length: 8 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('')
    }

    setCouponCode(generateCouponCode())

    // Load and display the scratch area
    const scratchImage = new Image()
    scratchImage.src = '/placeholder.svg?height=200&width=400'
    scratchImage.onload = () => {
      ctx.drawImage(scratchImage, 0, 0, canvas.width, canvas.height)
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('Scratch here!', canvas.width / 2, canvas.height / 2)
    }

    let isDrawing = false
    let lastPoint = { x: 0, y: 0 }

    // Function to calculate the percentage of the scratched area
    const getFilledInPixels = (stride) => {
      if (!stride || stride < 1) stride = 1
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const total = pixels.data.length / stride
      let count = 0
      for (let i = 0; i < pixels.data.length; i += stride) {
        if (pixels.data[i] === 0) count++
      }
      return Math.round((count / total) * 100)
    }

    // Function to handle the scratch effect
    const scratch = (x, y) => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(x, y)
      ctx.lineWidth = 40
      ctx.lineCap = 'round'
      ctx.stroke()

      lastPoint = { x, y }

      if (getFilledInPixels(32) > SCRATCH_PERCENTAGE) {
        setIsRevealed(true)
        controls.start({ opacity: 1, scale: 1 })
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 }
        })
      }
    }

    // Event handlers for pointer interactions
    const handlePointerMove = (e) => {
      if (!isDrawing) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      scratch(x, y)
    }

    const handlePointerDown = (e) => {
      isDrawing = true
      const rect = canvas.getBoundingClientRect()
      lastPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const handlePointerUp = () => {
      isDrawing = false
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
    }
  }, [controls])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg" style={{ maxWidth: '400px' }}>
        <div className="card-header bg-primary text-white text-center py-3">
          <h2 className="mb-0">Scratch & Win!</h2>
          <p className="mb-0">Reveal your 20% discount code for OPD services in Medford</p>
        </div>
        <div className="card-body p-4">
          <div className="position-relative" style={{ aspectRatio: '2/1' }}>
            <div className="position-absolute w-100 h-100 bg-light d-flex align-items-center justify-content-center rounded">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={controls}
                className="text-center"
              >
                <h3 className="h5 mb-2 text-primary">Your Coupon Code:</h3>
                <p className="display-6 fw-bold text-primary mb-3">{couponCode}</p>
                <p className="small text-muted">Use this code for 20% off OPD services in Medford</p>
                {isRevealed && (
                  <button className="btn btn-success mt-3">
                    <i className="bi bi-stars me-2"></i> Congratulations!
                  </button>
                )}
              </motion.div>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="position-absolute w-100 h-100 rounded"
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
