interface Descriptor {
  // serialize value to string
  stringify?(value: any): string

  // deserialize value from string
  parse?(value: string): any
}

interface DescriptorMap {
  [fieldName: string]: Descriptor
}

interface ContractStorage<T> {
  // delete key from Native Storage.
  // return 0 for success, otherwise failure.
  del(key: StorageKey): number

  // get value by key from Native Storage,
  // deserialize value by calling `descriptor.parse` and return.
  get(key: StorageKey): T

  // set key and value pair to Native Storage,
  // the value will be serialized to string by calling `descriptor.stringify`.
  // return 0 for success, otherwise failure.
  set(key: StorageKey, value: any): number

  // get and return value by key from Native Storage.
  rawGet(key: StorageKey): string
  // set key and value pair to Native Storage,
  // return 0 for success, otherwise failure.
  rawSet(key: StorageKey, value: string): number
}

interface LocalContractStorage {
  // define a object property named `fieldname` to `obj` with descriptor.
  // default descriptor is JSON.parse/JSON.stringify descriptor.
  // return this.
  defineProperty(obj: any, fieldName: string, descriptor?: Descriptor): any

  // define object properties to `obj` from `props`.
  // default descriptor is JSON.parse/JSON.stringify descriptor.
  // return this.
  defineProperties(obj: any, props: DescriptorMap): any

  // define a StorageMap property named `fieldname` to `obj` with descriptor.
  // default descriptor is JSON.parse/JSON.stringify descriptor.
  // return this.
  defineMapProperty(obj: any, fieldName: string, descriptor?: Descriptor): any

  // define StorageMap properties to `obj` from `props`.
  // default descriptor is JSON.parse/JSON.stringify descriptor.
  // return this.
  defineMapProperties(obj: any, props: DescriptorMap): any
}

type StorageKey = string | number

interface BigNumberConstructor {
  new(number: string | number): BigNumber
}

interface BigNumber {
  plus(number: string | number | BigNumber): BigNumber
  minus(number: string | number | BigNumber): BigNumber
  div(number: string | number | BigNumber): BigNumber
  mul(number: string | number | BigNumber): BigNumber

  lt(number: string | number | BigNumber): boolean
  gt(number: string | number | BigNumber): boolean
  eq(number: string | number | BigNumber): number

  toFixed(decimalCount: number): string
}

interface Block {
  timestamp: Timestamp
  seed: string
  height: number
}

interface Transaction {
  hash: Hash
  from: Address
  to: Address
  value: Value
  nonce: number
  timestamp: Timestamp
  gasPrice: Value
  gasLimit: Value
}

interface Blockchain {
  block: Block
  transaction: Transaction

  transfer(to: Address, value: Value): boolean
  verifyAddress(address: Address): boolean
}

type Address = string
type Hash = string
type Timestamp = string
type Value = BigNumber

declare const BigNumber: BigNumberConstructor
declare const LocalContractStorage: LocalContractStorage
declare const Blockchain: Blockchain