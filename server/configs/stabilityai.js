import axios from "axios";

const stability = axios.create({
    baseURL:"https://api.stability.ai/v2beta/stable-image/generate/core",
    headers:{
        Authorization:`Bearer ${process.env.STABILITY_API_KEY}`,
        Accept:"application/json",
        "Content-Type":"multipart/form-data"
    }
})

export default stability;