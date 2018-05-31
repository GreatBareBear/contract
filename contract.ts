enum Category {
  crypto = 0,
  dogs,
  cute,
  memes,
  programming,
  games,
  cars,
  art,
  fun,
  other
}

const unitMap = {
  'none': '0',
  'None': '0',
  'wei': '1',
  'kwei': '1000',
  'mwei': '1000000',
  'gwei': '1000000000',
  'nas': '1000000000000000000',
}

function unitValue(unit) {
  unit = unit ? unit.toLowerCase() : 'nas'
  const unitValue = unitMap[ unit ]

  if (unitValue === undefined) {
    throw new Error(`The unit ${unit} does not exist, please use the following units: ${JSON.stringify(unitMap, null, 2)}`)
  }

  return new BigNumber(unitValue)
}

function toBasic(value, unit: string) {
  return value.mul(unitValue(unit))
}

function fromBasic(value, unit: string) {
  return value.div(unitValue(unit))
}

class Image {
  public id: number
  public width: number
  public height: number
  public name: string
  public author: string
  public url: string
  public category: Category
  public authorAddress: Address

  constructor(json?: string) {
    if (json) {
      const object: ImageObject = JSON.parse(json)

      this.id = object.id
      this.width = object.width
      this.height = object.height
      this.url = object.url
      this.name = object.name
      this.author = object.author
      this.category = object.category
      this.authorAddress = object.authorAddress
    }
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

interface ImageObject {
  id: number
  width: number
  height: number
  name: string
  author: string
  url: string
  category: Category
  authorAddress: Address
}

class ImgCubeContract {
  images: ContractStorage<Image>
  imageCount: number
  ownerAddress: Address

  constructor() {
    LocalContractStorage.defineMapProperty(this, 'images', {
      parse(json) {
        return new Image(json)
      },
      stringify(object) {
        return object.toString()
      }
    })

    LocalContractStorage.defineProperty(this, 'imageCount', null)
    LocalContractStorage.defineProperty(this, 'ownerAddress', null)
  }

  init() {
    this.imageCount = 0
    this.ownerAddress = Blockchain.transaction.from
  }

  upload(rawImages: ImageObject[]): boolean {
    for (const rawImage of rawImages) {
      rawImage.authorAddress = Blockchain.transaction.from
      rawImage.id = this.imageCount

      const image = new Image(JSON.stringify(rawImage))

      this.images.set(this.imageCount, image)
      this.imageCount++
    }

    return true
  }

  clear(): boolean {
    if (Blockchain.transaction.from !== this.ownerAddress) {
      throw new Error('Unauthorized')
    }

    for (let i = 0; i < this.imageCount; i++) {
      this.images.del(i)
    }

    this.imageCount = 0

    return true
  }

  delete(id: string): boolean {
    if (Blockchain.transaction.from !== this.ownerAddress) {
      throw new Error('Unauthorized')
    }

    for (let i = parseInt(id); i < this.imageCount - 1; ++i) {
      this.images.set(i, this.images.get(i + 1))
    }

    this.images.del(this.imageCount)
    this.imageCount--

    return true
  }

  tip(id: string): boolean {
    const image = this.images.get(id)

    if (!image) {
      throw new Error(`Image with ${id} doesn't exist.`)
    }

    if (Blockchain.transaction.value.gt(0)) {
      Blockchain.transfer(image.authorAddress, Blockchain.transaction.value)
    } else {
      throw new Error(`Tip needs to be higher than 0 NAS.`)
    }

    return true
  }

  get(id: string) {
    return this.images.get(id)
  }

  getImageCount() {
    return this.imageCount
  }

  query(count, offset = 0, category?) {
    const images = []

    for (let i = offset; i < offset + count; i++) {
      const image = this.images.get(i)

      if (!image) {
        continue
      }

      if (image.category === category || category === undefined) {
        images.push(image)
      } else {
        count++
      }
    }

    return images
  }
}

export = ImgCubeContract