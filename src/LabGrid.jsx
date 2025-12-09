import ProfileCard from "./ProfileCard";

const members = [
  {
    name: "Dr. Meera Singh",
    role: "AI Research Lead",
    img: "https://i.pravatar.cc/100?img=1",
    specialty: "Neural Networks & Vision"
  },
  {
    name: "Saurabh Kumar",
    role: "ML Engineer",
    img: "https://i.pravatar.cc/100?img=12",
    specialty: "LLM Fine-tuning"
  },
  {
    name: "Ananya Patel",
    role: "Data Scientist",
    img: "https://i.pravatar.cc/100?img=5",
    specialty: "Data Modelling"
  },
  {
    name: "Ravi Verma",
    role: "Robotics AI",
    img: "https://i.pravatar.cc/100?img=22",
    specialty: "Reinforcement Learning"
  }
];

function LabGrid() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">AI LAB MEMBERS</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {members.map((m, i) => (
          <ProfileCard 
            key={i}
            name={m.name}
            role={m.role}
            img={m.img}
            specialty={m.specialty}
          />
        ))}
      </div>
    </div>
  );
}

export default LabGrid;
