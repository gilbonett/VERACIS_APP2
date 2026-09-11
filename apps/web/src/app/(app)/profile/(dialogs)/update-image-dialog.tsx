'use client'

import { uploadAvatarAction } from '@/actions/upload-avatar-action'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog'
import { Spinner } from '@/components/spinner'
import { ImageUp } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'

function createImageUrl(file: File | null): string | undefined {
  if (!file) return

  if (!file.type.startsWith('image/')) {
    return
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return
  }

  return URL.createObjectURL(file)
}

export function UpdateImageDialog() {
  const { executeAsync, isPending } = useAction(uploadAvatarAction)
  const [open, setOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const newImageUrl = useMemo(() => {
    return createImageUrl(file)
  }, [file])

  const imageUrl = newImageUrl

  useEffect(() => {
    return () => {
      if (newImageUrl) {
        URL.revokeObjectURL(newImageUrl)
      }
    }
  }, [newImageUrl])

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCancel = () => {
    setFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setOpen(false)
  }

  async function handleUpdate() {
    if (!imageUrl || !croppedAreaPixels) return

    const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels)

    const formData = new FormData()
    formData.append('file', croppedImage, file?.name || 'profile.jpg')

    await executeAsync(formData)

    setOpen(false)
  }

  useEffect(() => {
    if (!open) {
      handleCancel()
    }
  }, [open])

  const showCropper = Boolean(imageUrl)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Alterar Foto</Button>} />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atualizar foto de perfil</DialogTitle>
          <DialogDescription>
            {file
              ? 'Ajuste o recorte da imagem'
              : 'Selecione uma nova imagem ou edite a atual'}
          </DialogDescription>
        </DialogHeader>

        <div className="w-full h-96 relative rounded-lg overflow-hidden border-dashed border">
          {showCropper ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1} // 1:1 para perfil circular
              cropShape="round" // Crop circular
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          ) : (
            <label
              htmlFor="image"
              className="w-full h-full flex flex-col justify-center items-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex justify-center items-center size-10 border rounded-full">
                <ImageUp className="text-muted-foreground" />
              </div>
              <span className="font-semibold">Carregar imagem</span>
              <p className="text-muted-foreground text-sm">
                PNG, JPG ou WEBP (máx. 5 MB)
              </p>
              <input
                id="image"
                type="file"
                className="sr-only"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  const files = e.target.files
                  if (files) {
                    setFile(files[0])
                  }
                }}
              />
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={isPending} onClick={handleCancel}>
            Cancelar
          </Button>
          <Button disabled={!showCropper || isPending} onClick={handleUpdate}>
            {isPending ? <Spinner /> : 'Atualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Função auxiliar para criar a imagem croppada
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas is empty'))
        }
      },
      'image/jpeg',
      0.95,
    )
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}
