let Blockchain, LocalContractStorage, Event, BigNumber

enum Category {
  Cats = 0,
  Dogs,
  Memes,
  Burgers,
  Cartoons,
  Fun,
  Art,
  Other
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

  return new BigNumber(unitValue, 10)
}

function toBasic(value, unit: string) {
  return value.mul(unitValue(unit))
}

function fromBasic(value, unit: string) {
  return value.div(unitValue(unit))
}

class Image {
  public width: number
  public height: number
  public name: string
  public author: string
  public url: string
  public category: Category

  constructor(json?: string) {
    if (json) {
      const object: ImageObject = JSON.parse(json)

      this.width = object.width
      this.height = object.height
      this.url = object.url
      this.name = object.name
      this.author = object.author
      this.category = object.category
    }
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

interface ImageObject {
  width: number
  height: number
  name: string
  author: string
  url: string
  category: Category
}

class Upload {
  public value

  constructor(json: string) {
    if (json) {
      const object = JSON.parse(json)

      this.value = object.value
    }
  }

  toString() {
    return JSON.stringify(this)
  }
}

class ImgCubeContract {
  images
  imageCount
  nextUploads

  constructor() {
    LocalContractStorage.defineMapProperty(this, 'images', {
      parse(json) {
        return new Image(json)
      },
      stringify(object) {
        return object.toString()
      }
    })

    LocalContractStorage.defineMapProperty(this, 'nextUploads', {
      parse(json) {
        return new Upload(json)
      },
      stringify(object) {
        return object.toString()
      }
    })

    LocalContractStorage.defineProperty(this, 'imageCount', null)
  }

  init() {
    this.imageCount = 0
  }

  payUpload(): boolean {
    if (this.nextUploads.get(Blockchain.transaction.from)) {
      const upload: Upload = this.nextUploads.get(Blockchain.transaction.from)

      Blockchain.transfer(Blockchain.transaction.from, upload.value)

      this.nextUploads.del(Blockchain.transaction.from)
    }

    this.nextUploads.set(Blockchain.transaction.from, new Upload(JSON.stringify({
      value: Blockchain.transaction.value
    })))

    return true
  }

  returnPaidUpload(): boolean {
    const upload: Upload = this.nextUploads.get(Blockchain.transaction.from)

    if (upload) {
      Blockchain.transfer(Blockchain.transaction.from, upload.value)
      this.nextUploads.del(Blockchain.transaction.from)
    }

    return true
  }

  upload(rawImages: ImageObject[]): boolean {
    const value = new BigNumber(this.nextUploads.get(Blockchain.transaction.from).value)

    let price = new BigNumber(0)

    for (const rawImage of rawImages) {
      price = price.plus(toBasic(new BigNumber(new BigNumber(rawImage.width * rawImage.height).div(18300000).toFixed(18)), 'nas'))

      const image = new Image(JSON.stringify(rawImage))

      this.images.set(this.imageCount, image)
      this.imageCount++
    }

    if (value.lt(price)) {
      throw new Error(`Not enough NAS sent (${fromBasic(price, 'nas')} expected, ${fromBasic(value, 'nas')} sent).`)
    }

    this.nextUploads.del(Blockchain.transaction.from)

    return true
  }

  clear(): boolean {
    for (let i = 0; i < this.imageCount; i++) {
      this.images.del(i)
    }

    return true
  }

  delete(id: string): boolean {
    this.images.del(id)

    return true
  }

  get(id: string) {
    return this.images.get(id)
  }

  getImageCount() {
    return this.imageCount
  }

  query(count: number, offset: number = 0, category?: Category) {
    const images: Image[] = []

    for (let i = offset; i < offset + count; i++) {
      const image = this.images.get(this.imageCount - count + i - 1)

      if (!image) {
        continue
      }

      if (category !== undefined && image.category === category) {
        images.push(image)
      } else if (category === undefined) {
        images.push(image)
      }
    }

    return images
  }
}

export = ImgCubeContract