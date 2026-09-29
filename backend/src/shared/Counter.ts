import mongoose from 'mongoose';

interface CounterDocument {
  _id: string;
  seq: number;
}

const counterSchema = new mongoose.Schema<CounterDocument>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, collection: 'counters' },
);

export const CounterModel = mongoose.model<CounterDocument>('Counter', counterSchema);

/** Atomically increments and returns the next value of a named sequence. */
export const nextSequence = async (key: string, startAt = 0): Promise<number> => {
  const counter = await CounterModel.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
    .lean<{ seq: number }>()
    .exec();

  const value = counter?.seq ?? startAt + 1;
  return value;
};

export const resetSequence = async (key: string): Promise<void> => {
  await CounterModel.deleteOne({ _id: key }).exec();
};
