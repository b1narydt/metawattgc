import {
    WalletClient,
    Utils,
    Transaction,
    LockingScript,
    PushDrop,
    WalletProtocol,
    WERR_REVIEW_ACTIONS,
} from '@bsv/sdk'
import { v4 as uuidv4 } from 'uuid'

export interface CardData {
    name: string
    description: string
    rarity: string
    ability: string
    history: string
    sats: number
    txid: string
    outputIndex: number
    outputScript: string
    keyID: string
    envelope?: any
  }
  
const walletClient = new WalletClient('json-api', 'localhost')
const pushdrop = new PushDrop(walletClient)
  
const PROTOCOL_ID: WalletProtocol = [1, 'card collectables']
const BASKET_NAME = 'cards'
  
function generateUniqueKeyID(): string {
    return uuidv4()
  }
  
  export async function createCard(
    card: Omit<
      CardData,
      'txid' | 'outputIndex' | 'outputScript' | 'envelope' | 'keyID'
    >,
    testWerrLabel = false
  ): Promise<void> {
    try {
      // 1. Generate a unique keyID using generateUniqueKeyID.
      const keyID = generateUniqueKeyID()
      
      // 2. Create a JSON object with card attributes and convert it to a UTF-8 array
      const cardJSON = Utils.toArray(JSON.stringify({
        name: card.name,
        description: card.description,
        rarity: card.rarity,
        ability: card.ability
      }))
      
      // 3. Create a locking script with the encoded attributes
      const lockingScript = await pushdrop.lock(
        [cardJSON],
        PROTOCOL_ID,
        keyID,
        'self',
        true
      )

      // 4. Create the transaction with the card data
      // Ensure satoshis is a number
      const satoshis = Number(card.sats);
      
      if (isNaN(satoshis)) {
        throw new Error('Invalid satoshis value: must be a number');
      }

      const result = await walletClient.createAction({
        description: 'Create collectible card',
        outputs: [
          {
            lockingScript: lockingScript.toHex(),
            satoshis: satoshis,
            outputDescription: 'digital collectible card',
            basket: BASKET_NAME,
            customInstructions: JSON.stringify({ keyID, history: card.history || '' })
          }
        ],
        options: { 
          randomizeOutputs: false, 
          acceptDelayedBroadcast: false 
        }
      })

    } catch (err: unknown) {
        if (err instanceof WERR_REVIEW_ACTIONS) {
            console.error('[createCard] Wallet threw WERR_REVIEW_ACTIONS:', {
                code: err.code,
                message: err.message,
                reviewActionResults: err.reviewActionResults,
                sendWithResults: err.sendWithResults,
                txid: err.txid,
                tx: err.tx,
                noSendChange: err.noSendChange
            })
        } else if (err instanceof Error) {
            console.error('[createCard] Failed with error status:', {
                message: err.message,
                name: err.name,
                stack: err.stack,
                error: err
            })
        } else {
            console.error('[createCard] Failed with unknown error:', err)
        }
        throw err
    }
}

export async function loadCards(): Promise<CardData[]> {
    console.log('[loadCards] Fetching card outputs from basket:', BASKET_NAME)
    
    try {
      // 1. Fetch outputs from the wallet
      const { outputs, BEEF } = await walletClient.listOutputs({
        basket: BASKET_NAME,
        include: 'entire transactions',
        includeCustomInstructions: true
      })
      
      console.log('[loadCards] Retrieved outputs:', outputs.length)

      // Process all outputs in parallel
      const cards = await Promise.all(
        outputs.map(async (entry: any) => {
          try {
            // 2. Extract txid and outputIndex from outpoint
            const [txid, voutStr] = entry.outpoint.split('.')
            const outputIndex = parseInt(voutStr, 10)
            if (!BEEF || isNaN(outputIndex)) return null

            // 3. Parse transaction and get locking script
            const tx = Transaction.fromBEEF(BEEF, txid)
            const output = tx.outputs[outputIndex]
            if (!output) return null

            const script = output.lockingScript
            
            // 4. Decode PushDrop script to get card data
            const decoded = PushDrop.decode(script)
            if (!decoded.fields || decoded.fields.length === 0) return null
            
            // 5. Parse card attributes from JSON
            const cardData = JSON.parse(Utils.toUTF8(decoded.fields[0]))
            
            // 6. Extract metadata from customInstructions or outputDescription
            let keyID = ''
            let history = ''
            
            try {
              const metadata = entry.customInstructions 
                ? JSON.parse(entry.customInstructions)
                : entry.outputDescription 
                  ? JSON.parse(entry.outputDescription)
                  : { keyID: '', history: '' }
              
              keyID = metadata.keyID || ''
              history = metadata.history || ''
            } catch (e) {
              console.warn('[loadCards] Failed to parse metadata:', e)
            }

            console.log(`[loadCards] Loaded card: ${cardData.name || 'unnamed'}`)

            // 7. Build and return CardData object
            const card: CardData = {
              name: cardData.name || '',
              description: cardData.description || '',
              rarity: cardData.rarity || 'common',
              ability: cardData.ability || '',
              history: history,
              sats: entry.satoshis,
              txid,
              outputIndex,
              outputScript: script.toHex(),
              keyID,
              envelope: entry.envelope
            }
            
            return card
          } catch (err) {
            console.warn('[loadCards] Failed to process entry:', entry, err)
            return null
          }
        })
      )

      // 8. Filter out null values and return
      return cards.filter((card): card is CardData => card !== null)
    } catch (err) {
      console.error('[loadCards] Failed to load cards:', err)
      throw err
    }
}


export async function redeemCard(card: CardData): Promise<void> {
  console.log(`[redeemCard] Redeeming card ${card.txid}:${card.outputIndex}`)
  
  try {
    // 1. Fetch BEEF data
    const { BEEF } = await walletClient.listOutputs({
      basket: BASKET_NAME,
      include: 'entire transactions'
    })
    
    if (!BEEF) {
      throw new Error('BEEF data not found for transaction')
    }
    
    // 2. Parse output script
    const script = LockingScript.fromHex(card.outputScript)
    
    // 3. Create unlocker
    const unlocker = pushdrop.unlock(
      PROTOCOL_ID,
      card.keyID,
      'self',
      'all',
      false,
      card.sats,
      script
    )
    
    // 4. Create action
    const partial = await walletClient.createAction({
      description: 'Redeem Collectible Card',
      inputBEEF: BEEF,
      inputs: [
        {
          outpoint: `${card.txid}.${card.outputIndex}`,
          unlockingScriptLength: 73, // Standard P2PKH script length
          inputDescription: 'Collectible Card Token'
        }
      ],
      options: { 
        randomizeOutputs: false, 
        acceptDelayedBroadcast: false 
      }
    })
    
    if (!partial.signableTransaction) {
      throw new Error('Failed to create redeem transaction')
    }
    
    // 5. Sign and submit transaction
    const unlockingScript = await unlocker.sign(
      Transaction.fromBEEF(partial.signableTransaction.tx),
      card.outputIndex
    )
    
    const signResult = await walletClient.signAction({
      reference: partial.signableTransaction.reference,
      spends: {
        [card.outputIndex]: {
          unlockingScript: unlockingScript.toHex()
        }
      }
    })
    
    if (!signResult.txid) {
      throw new Error('Failed to sign redeem transaction')
    }
    
    console.log(`[redeemCard] Successfully redeemed card: ${signResult.txid}`)
    return;
  } catch (err: unknown) {
    // 6. Error handling
    if (err instanceof WERR_REVIEW_ACTIONS) {
      console.error('[redeemCard] Wallet threw WERR_REVIEW_ACTIONS:', {
        code: err.code,
        message: err.message,
        reviewActionResults: err.reviewActionResults,
        sendWithResults: err.sendWithResults,
        txid: err.txid,
        tx: err.tx,
        noSendChange: err.noSendChange
      })
    } else if (err instanceof Error) {
      console.error('[redeemCard] Redemption failed with error status:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        error: err
      })
    } else {
      console.error('[redeemCard] Redemption failed with unknown error:', err)
    }
    throw err
  }
}