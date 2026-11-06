import type { Metadata } from 'next'
import { Floor } from '@/components/home/Floor'

export const metadata: Metadata = {
  title: 'The Atlas',
  description: 'Everything Kognivo makes, laid out on one endless printed floor. Drag or scroll to travel, click a pile to pull it out.',
}

export default function AtlasPage() {
  return (
    <div className="atlas">
      <Floor />
    </div>
  )
}
