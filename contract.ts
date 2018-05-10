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

// params: [{"width": 100, "height": 100, "base64": "", "name": "a", "username": "user1", "category": 0}]

class Image {
  public width: number
  public height: number
  public base64: string
  public name: string
  public username: string
  public category: Category

  // TODO: More!
  constructor(json?: string) {
    if (json) {
      const object = JSON.parse(json)

      this.width = object.width
      this.height = object.height
      this.base64 = object.base64
      this.name = object.name
      this.username = object.username
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
  base64: string
  name: string
  username: string
  category: Category
}

class ImgCubeContract {
  images
  imageCount

  constructor() {
    LocalContractStorage.defineMapProperty(this, "images", {
      parse: function (json) {
        return new Image(json);
      },
      stringify: function (object) {
        return object.toString();
      }
    });

    LocalContractStorage.defineProperty(this, "imageCount", null)
  }

  init() {
    this.imageCount = 0
  }

  upload(image: ImageObject): boolean {
    const price = new BigNumber(image.width * image.height).div(2000000).mul(1000000000000000000)
    const sent = new BigNumber(Blockchain.transaction.value)

    console.warn(price)
    console.warn(sent)

    if (sent.lt(price)) {
      throw new Error(`Not enough NAS sent (${price.div(1000000000000000000)} expected, ${Blockchain.transaction.value.div(1000000000000000000)} sent).`)
    }

    this.images.set(this.imageCount, new Image(JSON.stringify(image)))
    this.imageCount++

    return true
  }

  get(name: string) {
    return this.images.get(name)
  }

  query(count: number, category?: Category) {
    let images: Image[] = []

    for (let i = 0; i < count; i++) {
      const image = this.images.get(this.imageCount - count + i)

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
/*
  save(height) {
    const from = Blockchain.transaction.from
    const value = Blockchain.transaction.value
    const blockHeight = Blockchain.block.height

    const originalDeposit = this.bankVault.get(from)

    if (originalDeposit) {
      value.plus(originalDeposit)
    }

    const deposit = new Deposit()

    deposit.balance = value
    deposit.expiryHeight = blockHeight.plus(height)
  }

  takeOut(value) {
    const from = Blockchain.transaction.from
    const amount = new BigNumber(value)
    const blockHeight = Blockchain.block.height

    const deposit = this.bankVault.get(from)

    if (!deposit) {
      throw new Error("No deposit found.")
    }

    if (blockHeight.lt(deposit.expiryHeight)) {
      throw new Error("Cannot take out before expiryHeight.")
    }

    if (amount.gt(deposit.balance)) {
      throw new Error("Cannout take out more than deposited.")
    }

    const result = Blockchain.transfer(from, amount)

    if (!result) {
      throw new Error("Transfer failed.")
    }

    Event.Trigger("BankVault", {
      transfer: {
        from: Blockchain.transaction.to,
        to: from,
        value: amount
      }
    })

    deposit.balance = deposit.balance.sub(amount)

    this.bankVault.put(from, deposit)
  }

  balanceOf() {
    return this.bankVault.get(Blockchain.transaction.from)
  }

  verifyAddress(address) {
    return Blockchain.verifyAddress(address) == 1
  }*/
}

export = ImgCubeContract