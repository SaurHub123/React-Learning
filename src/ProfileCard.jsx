function ProfileCard({ name, role, img, specialty }) {
  return (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-lg hover:scale-105 transition">

      <img 
        src={img} 
        alt={name} 
        className="w-20 h-20 rounded-full mx-auto border-2 border-cyan-600"
      />

      <h2 className="text-xl font-semibold mt-3 text-center">{name}</h2>
      <p className="text-sm text-center text-gray-300">{role}</p>

      <div className="mt-3 bg-cyan-700 p-2 rounded text-center">
        {specialty}
      </div>

      <button className="mt-3 w-full bg-blue-700 hover:bg-blue-800 p-2 rounded">
        View Profile
      </button>

    </div>
  );
}

export default ProfileCard;
