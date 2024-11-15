import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";


const useUpdateProfile = (updatedData) => {
    const queryClient = useQueryClient();
    const {mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/users/update`, {
					method: "POST",
					body: JSON.stringify(updatedData),
					headers: {
						"Content-Type": "application/json"
					}
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error.message || "Something went wrong");
			}
		},
		onSuccess: () => {
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
				queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
			]);
			toast.success("Profile updated successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
    return {updateProfile, isUpdatingProfile};
}

export default useUpdateProfile;