import { Spinner } from '@/components/spinner'

export default function Loading() {
  return (
    <div className="w-screen h-screen flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  )
}
