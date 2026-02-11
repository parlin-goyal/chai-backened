import mongoose,{Schema} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


const playlistSchema = new Schema(
    {
        fullName:{
            type:String,
            required:true,
        },
        description:{
            type:String,
        },
        Videos:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video",
            }
        ],
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
        }

    },{timestamps:true})

    playlistSchema.plugin(mongoosePaginate);
    export const Playlist= mongoose.model("Playlist",playlistSchema);
