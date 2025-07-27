import {
    WalletClient,
    Utils,
    Transaction,
    PushDrop,
    WERR_REVIEW_ACTIONS
} from '@bsv/sdk'
  
const walletClient = new WalletClient('json-api', 'localhost')
const pushdrop = new PushDrop(walletClient)
  
  const PROTOCOL_ID: [0, string] = [0, 'todo list']
const KEY_ID = '1'
const BASKET_NAME = 'todo tasks'
  
export async function createTaskToken(
    task: string,
    amount: number,
    testWerrLabel = false
  ) {
    console.log('[createTaskToken] Encrypting task:', task)
    
    try {
        // 1. Encrypt the task with PROTOCOL_ID and KEY_ID
        const encryptedTask = await walletClient.encrypt({
            protocolID: PROTOCOL_ID,
            keyID: KEY_ID,
            plaintext: Utils.toArray(task)
        })

        // 2. Create a locking script
        const lockingScript = await pushdrop.lock(
            [encryptedTask.ciphertext],
            PROTOCOL_ID,
            KEY_ID,
            'self',
            true
        )
    // 3. Call walletClient.createAction to create a transaction with the locking script, amount in satoshis, BASKET_NAME, and appropriate options (randomizeOutputs: false, acceptDelayedBroadcast: false).
        const result = await walletClient.createAction({
            description: 'Create task token',
            outputs: [
                {
                    lockingScript: lockingScript.toHex(),
                    satoshis: amount,
                    outputDescription: 'Task token',
                    basket: BASKET_NAME
                }
            ],
            options: { randomizeOutputs: false, acceptDelayedBroadcast: false }
        })

        // 4. Verify the transaction was created
        if (!result.tx || !result.txid) {
            throw new Error('Transaction not created')
        }

        // 5. Return the transaction ID and script
        return { 
            txid: result.txid, 
            script: lockingScript.toHex() 
        }
    } catch (err: unknown) {
        if (err instanceof WERR_REVIEW_ACTIONS) {
            console.error('[createTaskToken] Wallet threw WERR_REVIEW_ACTIONS:', {
                code: err.code,
                message: err.message,
                reviewActionResults: err.reviewActionResults,
                sendWithResults: err.sendWithResults,
                txid: err.txid,
                tx: err.tx,
                noSendChange: err.noSendChange
            })
        } else if (err instanceof Error) {
            console.error('[createTaskToken] Failed with error status:', {
                message: err.message,
                name: err.name,
                stack: err.stack,
                error: err
            })
        } else {
            console.error('[createTaskToken] Failed with unknown error:', err)
        }
        throw err
    }
}
  
  export async function loadTasks(): Promise<
    Array<{
      task: string
      sats: number
      token: {
        txid: string
        outputIndex: number
        lockingScript: any
      }
    }>
  > {
    console.log('[loadTasks] Fetching outputs from basket:', BASKET_NAME)
  
    const { outputs, BEEF } = await walletClient.listOutputs({
      basket: BASKET_NAME,
      include: 'entire transactions'
    })
  
    console.log('[loadTasks] Retrieved outputs:', outputs.length)
  
    const tasks = await Promise.all(
      outputs.map(async (entry: any) => {
        try {
          const [txid, voutStr] = entry.outpoint.split('.')
          const vout = parseInt(voutStr, 10)
          if (!BEEF || isNaN(vout)) return null
  
          const tx = Transaction.fromBEEF(BEEF, txid)
          const output = tx.outputs[vout]
          if (!output) return null
  
          const script = output.lockingScript
          const decoded = PushDrop.decode(script)
          const encryptedTask = decoded.fields[0]
  
          console.log('[loadTasks] Decrypting task from output:', entry.outpoint)
  
          const decrypted = await walletClient.decrypt({
            ciphertext: encryptedTask,
            protocolID: PROTOCOL_ID,
            keyID: KEY_ID
          })
  
          const plaintext = Utils.toUTF8(decrypted.plaintext)
          console.log('[loadTasks] Decrypted task:', plaintext)
  
          return {
            task: plaintext,
            sats: entry.satoshis,
            token: {
              txid,
              outputIndex: vout,
              lockingScript: script
            }
          }
        } catch (err) {
          console.warn('[loadTasks] Failed to process entry:', entry, err)
          return null
        }
      })
    )
  
    const filtered = tasks.filter((t): t is NonNullable<typeof t> => t !== null)
    console.log('[loadTasks] Final list of tasks:', filtered)
    return filtered
  }
  
  export async function redeemTask(token: {
    txid: string
    outputIndex: number
    lockingScript: any
    amount: number
  }) {
    console.log('[redeemTask] Redeeming task for TXID:', token.txid)
  
    const { BEEF } = await walletClient.listOutputs({
      basket: BASKET_NAME,
      include: 'entire transactions'
    })
  
    if (!BEEF) throw new Error('BEEF data not found for transaction')
    const tx = Transaction.fromBEEF(BEEF, token.txid)
  
    const unlocker = pushdrop.unlock(
      PROTOCOL_ID,
      KEY_ID,
      'self',
      'all',
      false,
      1,
      token.lockingScript
    )
  
    try {
      const partial = await walletClient.createAction({
        description: 'Complete ToDo Task',
        inputBEEF: BEEF,
        inputs: [
          {
            outpoint: `${token.txid}.${token.outputIndex}`,
            unlockingScriptLength: 73,
            inputDescription: 'ToDo task token'
          }
        ],
        options: { randomizeOutputs: false, acceptDelayedBroadcast: false }
      })
  
      const unlockingScript = await unlocker.sign(
        Transaction.fromBEEF(partial.signableTransaction!.tx),
        token.outputIndex
      )
  
      await walletClient.signAction({
        reference: partial.signableTransaction!.reference,
        spends: {
          [token.outputIndex]: {
            unlockingScript: unlockingScript.toHex()
          }
        }
      })
  
      console.log('[redeemTask] Redemption complete.')
    } catch (err: unknown) {
      if (err instanceof WERR_REVIEW_ACTIONS) {
        console.error('[redeemTask] Wallet threw WERR_REVIEW_ACTIONS:', {
          code: err.code,
          message: err.message,
          reviewActionResults: err.reviewActionResults,
          sendWithResults: err.sendWithResults,
          txid: err.txid,
          tx: err.tx,
          noSendChange: err.noSendChange
        })
      } else if (err instanceof Error) {
        console.error('[redeemTask] Redemption failed with error status:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
          error: err
        })
      } else {
        console.error('[redeemTask] Redemption failed with unknown error:', err)
      }
      throw err
    }
  }